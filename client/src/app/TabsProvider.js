/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import bpmnDiagram from './tabs/bpmn/diagram.bpmn';
import cloudBpmnDiagram from './tabs/cloud-bpmn/diagram.bpmn';
import cmmnDiagram from './tabs/cmmn/diagram.cmmn';
import dmnDiagram from './tabs/dmn/diagram.dmn';

import replaceIds from '@bpmn-io/replace-ids';

import EmptyTab from './EmptyTab';

import {
  find,
  forEach
} from 'min-dash';

import parseDiagramType from './util/parseDiagramType';

import {
  findUsages as findNamespaceUsages,
} from './tabs/util/namespace';

import {
  Flags,
  generateId
} from '../util';

const createdByType = {};

const noopProvider = {
  getComponent() {
    return null;
  },
  getInitialContents() {
    return null;
  }
};

const ENCODING_BASE64 = 'base64',
      ENCODING_UTF8 = 'utf8';

const EXPORT_JPEG = {
  name: 'JPEG image',
  encoding: ENCODING_BASE64,
  extensions: [ 'jpeg' ]
};

const EXPORT_PNG = {
  name: 'PNG image',
  encoding: ENCODING_BASE64,
  extensions: [ 'png' ]
};

const EXPORT_SVG = {
  name: 'SVG image',
  encoding: ENCODING_UTF8,
  extensions: [ 'svg' ]
};

const NAMESPACE_URL_ZEEBE = 'http://camunda.org/schema/zeebe/1.0';


/**
 * A provider that allows us to customize available tabs.
 */
export default class TabsProvider {

  constructor() {

    this.providers = {
      empty: {
        canOpen(file) {
          return false;
        },
        getComponent() {
          return EmptyTab;
        },
        getNewFileButton() {
          return null;
        }
      },
      bpmn: {
        name: 'BPMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'bpmn', 'xml' ],
        canOpen(file) {
          return parseDiagramType(file.contents) === 'bpmn';
        },
        getComponent(options) {
          return import('./tabs/bpmn');
        },
        getInitialContents(options) {
          return bpmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.bpmn`;
        },
        getHelpMenu() {
          return [{
            label: 'BPMN 2.0 Tutorial',
            action: 'https://camunda.org/bpmn/tutorial/'
          },
          {
            label: 'BPMN Modeling Reference',
            action: 'https://camunda.org/bpmn/reference/'
          }];
        },
        getNewFileMenu() {
          return [{
            label: 'BPMN Diagram (Camunda)',
            accelerator: 'CommandOrControl+T',
            action: 'create-bpmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new BPMN Diagram (Camunda)',
            action: 'create-bpmn-diagram'
          };
        }
      },
      'cloud-bpmn': {
        name: null,
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'bpmn', 'xml' ],
        canOpen(file) {
          const {
            contents
          } = file;

          if (!contents) {
            return false;
          }

          // (1) detect execution platform
          // TODO @barmac: implement

          // (2) detect zeebe namespace
          const used = findNamespaceUsages(contents, NAMESPACE_URL_ZEEBE);

          return !!used;
        },
        getComponent(options) {
          return import('./tabs/cloud-bpmn');
        },
        getInitialContents(options) {
          return cloudBpmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.bpmn`;
        },
        getHelpMenu() {
          return [];
        },
        getNewFileMenu() {
          return [{
            label: 'BPMN Diagram (Zeebe)',
            action: 'create-cloud-bpmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new BPMN Diagram (Zeebe)',
            action: 'create-cloud-bpmn-diagram'
          };
        }
      },
      dmn: {
        name: 'DMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'dmn', 'xml' ],
        canOpen(file) {
          return parseDiagramType(file.contents) === 'dmn';
        },
        getComponent(options) {
          return import('./tabs/dmn');
        },
        getInitialContents() {
          return dmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.dmn`;
        },
        getHelpMenu() {
          return [{
            label: 'DMN 1.1 Tutorial',
            action: 'https://camunda.org/dmn/tutorial/'
          }];
        },
        getNewFileMenu() {
          return [{
            label: 'DMN Diagram (Camunda)',
            action: 'create-dmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new DMN Diagram (Camunda)',
            action: 'create-dmn-diagram'
          };
        }
      },
      cmmn: {
        name: 'CMMN',
        encoding: ENCODING_UTF8,
        exports: {
          png: EXPORT_PNG,
          jpeg: EXPORT_JPEG,
          svg: EXPORT_SVG
        },
        extensions: [ 'cmmn', 'xml' ],
        canOpen(file) {
          return parseDiagramType(file.contents) === 'cmmn';
        },
        getComponent(options) {
          return import('./tabs/cmmn');
        },
        getInitialContents(options) {
          return cmmnDiagram;
        },
        getInitialFilename(suffix) {
          return `diagram_${suffix}.cmmn`;
        },
        getHelpMenu() {
          return [{
            label: 'CMMN 1.1 Tutorial',
            action: 'https://docs.camunda.org/get-started/cmmn11/'
          },
          {
            label: 'CMMN Modeling Reference',
            action: 'https://docs.camunda.org/manual/latest/reference/cmmn11/'
          }];
        },
        getNewFileMenu() {
          return [{
            label: 'CMMN Diagram',
            action: 'create-cmmn-diagram'
          }];
        },
        getNewFileButton() {
          return {
            label: 'Create new CMMN Diagram',
            action: 'create-cmmn-diagram'
          };
        }
      }
    };

    this.providersByFileType = {
      bpmn: [ this.providers['cloud-bpmn'], this.providers.bpmn ],
      dmn: [ this.providers.dmn ],
      cmmn: [ this.providers.cmmn ]
    };

    if (Flags.get('disable-cmmn', true)) {
      delete this.providers.cmmn;
      delete this.providersByFileType.cmmn;
    }

    if (Flags.get('disable-dmn')) {
      delete this.providers.dmn;
      delete this.providersByFileType.dmn;
    }
  }

  getProviderNames() {
    const names = [];

    forEach(this.providers, (provider) => {
      const { name } = provider;

      if (name) {
        names.push(name);
      }
    });

    return names;
  }

  getProviders() {
    return this.providers;
  }

  hasProvider(fileType) {
    return !!this._getProvidersForExtension[fileType].length;
  }

  getProvider(type) {
    return (this.providers[type] || noopProvider);
  }

  getTabComponent(type, options) {
    return this.getProvider(type).getComponent(options);
  }

  getInitialFileContents(type) {
    const rawContents = this.getProvider(type).getInitialContents();

    return rawContents && replaceIds(rawContents, generateId);
  }

  createFile(type) {

    const counter = (
      type in createdByType
        ? (++createdByType[type])
        : (createdByType[type] = 1)
    );

    const name = this._getInitialFilename(type, counter);

    const contents = this.getInitialFileContents(type);

    return {
      name,
      contents,
      path: null
    };
  }

  _getInitialFilename(providerType, suffix) {
    const provider = this.providers[providerType];

    return provider.getInitialFilename(suffix);
  }

  createTab(type, options) {

    const file = this.createFile(type, options);

    return this.createTabForFile(file);
  }

  createTabForFile(file) {

    const id = generateId();

    const type = this._getTabType(file);

    if (!type) {
      return null;
    }

    // fill empty file with initial contents
    if (!file.contents) {
      file.contents = this.getInitialFileContents(type);
    }

    return {
      file,
      id,
      get name() {
        return this.file.name;
      },
      set name(newName) {
        this.file.name = newName;
      },
      get title() {
        return this.file.path || 'unsaved';
      },
      type
    };

  }

  _getTabType(file) {
    const provider = this._getFileProvider(file);

    if (!provider) {
      return null;
    }

    for (let type in this.providers) {
      if (this.providers[type] === provider) {
        return type;
      }
    }
  }

  /**
   * Returns provider if available.
   *
   * Algorithm:
   * * check if there are providers defined for the file extension
   *   * if there is only one, return it (happy path)
   *   * if there are more than one:
   *     * return the first provider which can open the file
   *     * otherwise return the last provider
   *   * if there are none, return the first provider which can open the file or `null`
   *
   * @param {import('./TabsProvider').File} file
   * @returns {string | null}
   */
  _getFileProvider(file) {
    const typeFromExtension = getTypeFromFileExtension(file);

    const providersForExtension = this._getProvidersForExtension(typeFromExtension);

    // single provider specified for the extension
    if (providersForExtension.length === 1) {
      return providersForExtension[0];
    }

    // multiple providers specified for the extension
    if (providersForExtension.length > 1) {
      const provider = findProviderForFile(providersForExtension, file);

      // return the matching provider or the last provider as fallback
      return provider || providersForExtension[providersForExtension.length - 1];
    }

    // no providers specified for the extension; return the first that can open the file
    const provider = findProviderForFile(this.providers, file);

    return provider || null;
  }

  _getProvidersForExtension(extension) {
    return this.providersByFileType[extension] || [];
  }
}



// helper ///////////////////

function getTypeFromFileExtension(file) {
  const { name } = file;

  return name.substring(name.lastIndexOf('.') + 1).toLowerCase();
}

function findProviderForFile(providers, file) {
  return find(providers, provider => {
    if (provider.canOpen(file)) {
      return provider;
    }
  });
}
