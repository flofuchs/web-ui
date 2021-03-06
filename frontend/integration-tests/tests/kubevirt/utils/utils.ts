/* eslint-disable no-unused-vars, no-undef */
import * as _ from 'lodash';
import { execSync } from 'child_process';
import { $, by, ElementFinder, browser, ExpectedConditions as until } from 'protractor';

import { config } from '../../../protractor.conf';
import { nameInput as loginNameInput, passwordInput as loginPasswordInput, submitButton as loginSubmitButton } from '../../../views/login.view';
import { PAGE_LOAD_TIMEOUT } from './consts';

export type provisionOptions = {
  method: string,
  source?: string,
};

export type networkResource = {
  name: string,
  mac: string,
  binding: string,
  networkDefinition: string,
}[];

export type storageResource = {
  name: string,
  size: string,
  StorageClass: string,
}[];

export function removeLeakedResources(leakedResources: Set<string>) {
  const leakedArray: Array<string> = [...leakedResources];
  if (leakedArray.length > 0) {
    console.error(`Leaked ${leakedArray.join()}`);
    leakedArray.map(r => JSON.parse(r) as {name: string, namespace: string, kind: string})
      .forEach(({name, namespace, kind}) => {
        try {
          execSync(`kubectl delete -n ${namespace} --cascade ${kind} ${name}`);
        } catch (error) {
          console.error(`Failed to delete ${kind} ${name}:\n${error}`);
        }
      });
  }
  leakedResources.clear();
}

export function addLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.add(
    JSON.stringify({name: resource.metadata.name, namespace: resource.metadata.namespace, kind: resource.kind})
  );
}

export function removeLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.delete(
    JSON.stringify({name: resource.metadata.name, namespace: resource.metadata.namespace, kind: resource.kind})
  );
}

export function createResource(resource) {
  execSync(`echo '${JSON.stringify(resource)}' | kubectl create -f -`);
}

export function createResources(resources) {
  resources.forEach(createResource);
}

export function deleteResource(resource) {
  const kind = resource.kind === 'NetworkAttachmentDefinition' ? 'net-attach-def' : resource.kind;
  execSync(`kubectl delete -n ${resource.metadata.namespace} --cascade ${kind} ${resource.metadata.name}`);
}

export function deleteResources(resources) {
  resources.forEach(deleteResource);
}

export async function click(elem: ElementFinder, timeout?: number) {
  const _timeout = timeout !== undefined ? timeout : config.jasmineNodeOpts.defaultTimeoutInterval;
  await browser.wait(until.elementToBeClickable(elem), _timeout);
  await elem.click();
}

export async function selectDropdownOption(dropdownId: string, option: string) {
  await click($(dropdownId));
  await $(`${dropdownId} + ul`).element(by.linkText(option)).click();
}

export async function getDropdownOptions(dropdownId: string): Promise<string[]> {
  const options = [];
  await $(`${dropdownId} + ul`).$$('li').each(async(element) => {
    element.getText().then((text) => {
      options.push(text);
    });
  });
  return options;
}

export async function fillInput(elem: ElementFinder, value: string) {
  // Sometimes there seems to be an issue with clear() method not clearing the input
  let attempts = 3;
  do {
    --attempts;
    if (attempts < 0) {
      throw Error(`Failed to fill input with value: '${value}'.`);
    }
    await browser.wait(until.elementToBeClickable(elem));
    // TODO: line below can be removed when pf4 tables in use.
    await elem.click();
    await elem.clear();
    await elem.sendKeys(value);
  } while (await elem.getAttribute('value') !== value && attempts > 0);
}

export async function logIn() {
  await fillInput(loginNameInput, process.env.BRIDGE_AUTH_USERNAME);
  await fillInput(loginPasswordInput, process.env.BRIDGE_AUTH_PASSWORD);
  await click(loginSubmitButton);
  await browser.wait(until.visibilityOf($('img.pf-c-brand')), PAGE_LOAD_TIMEOUT);
}

/**
   * Search YAML manifest for a given string. Return true if found.
   * @param     {string}    needle    String to search in YAML.
   * @param     {string}    name      Name of the resource.
   * @param     {string}    namespace Namespace of the resource.
   * @param     {string}    kind      Kind of the resource.
   * @returns   {boolean}             True if found, false otherwise.
   */
export function searchYAML(needle: string, name: string, namespace: string, kind: string): boolean {
  const result = execSync(`oc get -o yaml -n ${namespace} ${kind} ${name}`).toString();
  return result.search(needle) >= 0;
}

export function getResourceJSON(name: string, namespace: string, kind: string) {
  return execSync(`oc get -o json -n ${namespace} ${kind} ${name}`).toString();
}

/**
   * Search JSON manifest for a given property and value. Return true if found.
   * @param     {string}    propertyPath    String representing path to object property.
   * @param     {string}    value           String representing expected value of searched property.
   * @param     {string}    name            Name of the resource.
   * @param     {string}    namespace       Namespace of the resource.
   * @param     {string}    kind            Kind of the resource.
   * @returns   {boolean}                   True if found, false otherwise.
   */
export function searchJSON(propertyPath: string, value: string, name: string, namespace: string, kind: string): boolean {
  const resource = JSON.parse(getResourceJSON(name, namespace, kind));
  const result = _.get(resource, propertyPath, undefined);
  return result === value;
}

export const waitForCount = (elementArrayFinder, targetCount) => {
  return async() => {
    const count = await elementArrayFinder.count();
    return count === targetCount;
  };
};

export function execCommandFromCli(command: string) {
  try {
    execSync(command);
  } catch (error) {
    console.error(`Failed to run ${command}:\n${error}`);
  }
}

export function exposeService(exposeServices: Set<any>) {
  const srvArray: Array<any> = [...exposeServices];
  srvArray.forEach(({name, kind, port, targetPort, exposeName, type}) => {
    execCommandFromCli(`virtctl expose ${kind} ${name} --port=${port} --target-port=${targetPort} --name=${exposeName} --type=${type}`);
  });
}

export async function asyncForEach(iterable, callback) {
  const array = [...iterable];
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const waitForStringInElement = (element: ElementFinder, needle: string) => {
  return async() => {
    const content = await element.getText();
    return content.includes(needle);
  };
};
