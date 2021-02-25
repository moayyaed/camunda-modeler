/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { omit } from 'min-dash';

import BaseEventHandler from './BaseEventHandler';

import { getMetrics } from '../../../util';

import parseExecutionPlatform from '../../../app/util/parseExecutionPlatform';

const HTTP_STATUS_PAYLOAD_TOO_BIG = 413;

const BINDING_TYPE_PROPERTY = 'property';
const ELEMENT_TEMPLATES_CONFIG_KEY = 'bpmn.elementTemplates';

const types = {
  BPMN: 'bpmn',
  DMN: 'dmn',
  CMMN: 'cmmn',
  CLOUD_BPMN: 'cloud-bpmn' // TODO: overthink that
};

// Sends a diagramOpened event to ET with diagram type: bpmn/dmn payload
// when a user opens a BPMN, DMN or CMMN diagram (create a new one or open from file).
export default class DiagramOpenEventHandler extends BaseEventHandler {

  constructor(props) {

    const {
      onSend,
      subscribe,
      config
    } = props;

    super('diagramOpened', onSend);

    this._config = config;

    subscribe('bpmn.modeler.created', async (context) => {

      const {
        tab
      } = context;

      const {
        file,
        type
      } = tab;

      if (type === types.BPMN) {
        return await this.onCamundaDiagramOpened(file);
      } else {
        return await this.onBpmnDiagramOpened(file, type);
      }
    });

    subscribe('dmn.modeler.created', () => {
      this.onDiagramOpened(types.DMN);
    });

    subscribe('cmmn.modeler.created', () => {
      this.onDiagramOpened(types.CMMN);
    });
  }

  generateMetrics = async (file, type) => {
    let metrics = {};

    if (file.contents) {
      metrics = await getMetrics(file, type);
    }

    return metrics;
  }

  getEngineProfile = (file) => {
    const {
      contents
    } = file;

    return parseExecutionPlatform(contents) || {};
  }

  onDiagramOpened = async (type, context = {}) => {

    if (!this.isEnabled()) {
      return;
    }

    const {
      elementTemplates,
      diagramMetrics,
      engineProfile
    } = context;

    const payload = {
      diagramType: type
    };

    if (elementTemplates) {
      payload.elementTemplates = elementTemplates;
      payload.elementTemplateCount = elementTemplates.length;
    }

    if (diagramMetrics) {
      payload.diagramMetrics = diagramMetrics;
    }

    if (engineProfile) {
      payload.engineProfile = engineProfile;
    }

    const response = await this.sendToET(payload);

    if (response && response.status === HTTP_STATUS_PAYLOAD_TOO_BIG) {

      // Payload too large, send again with smaller payload
      this.sendToET(omit(payload, ['elementTemplates']));
    }
  }

  onBpmnDiagramOpened = async (file, type, context = {}) => {

    const diagramMetrics = await this.generateMetrics(file, type);

    const engineProfile = this.getEngineProfile(file);

    return await this.onDiagramOpened(types.BPMN, {
      diagramMetrics,
      engineProfile,
      ...context
    });

  }

  onCamundaDiagramOpened = async (file) => {

    const elementTemplates = await this.getElementTemplates(file);

    return await this.onBpmnDiagramOpened(file, types.BPMN, {
      elementTemplates
    });

  }

  getElementTemplates = async (file) => {

    const config = this._config;

    const elementTemplates = await config.get(ELEMENT_TEMPLATES_CONFIG_KEY, file);

    if (!elementTemplates) {
      return [];
    }

    return elementTemplates.map((elementTemplate) => {
      const { appliesTo, properties } = elementTemplate;

      const propertyCounts = properties.map((property) => {

        const { binding } = property;
        const { type, name } = binding;

        if (type === BINDING_TYPE_PROPERTY) {
          return name;
        }

        return type;
      }).reduce((propertyCounts, property) => {

        if (propertyCounts[ property ]) {

          propertyCounts[ property ]++;
        } else {

          propertyCounts[ property ] = 1;
        }

        return propertyCounts;
      }, {});

      return { appliesTo, properties: propertyCounts };
    });
  }
}
