import localforage from "localforage";
import { get, writable } from "svelte/store";

const defaultDrivers = [{
  name: 'Local'
},{
  name: 'App'
}]

const drivers = defaultDrivers.map(driver => {
  return {
    name: driver.name,
    driver : localforage.createInstance({
      driver: localforage.INDEXEDDB,
      name: driver.name
    })
  }
})


export async function getAll(): Promise<({
  name: string,
  type: 'driver',
} | {
  name: string,
  type: 'file',
  driver: string
})[]> {
  if (!drivers) {
    return []
  }
  const driversNode = drivers.map(driver => {
    return {
      name: driver.name,
      type: 'driver' as const
    }
  })

  const filesNode = Promise.all(drivers.map(async driver => {
    const keys = await driver.driver.keys();
    return keys.map(key => {
      return {
        name: `${driver.name}:${key}`,
        type: 'file' as const,
        driver: driver.name,
      }
    })
  }))

  return [...driversNode, ...(await filesNode).flat()]
}


export async function setItem(fileName: string, data: any) {
  const [driverName, key] = fileName.split(':')
  const driver = drivers.find(driver => driver.name === driverName)
  if (!driver) {
    throw new Error('Driver not found')
  }
  await driver.driver.setItem(key, data)
}

export async function removeItem(fileName: string) {
  const [driverName, key] = fileName.split(':')
  const driver = drivers.find(driver => driver.name === driverName)
  if (!driver) {
    throw new Error('Driver not found')
  }
  await driver.driver.removeItem(key)
}

export async function getItem(fileName: string) {
  const [driverName, key] = fileName.split(':')
  const driver = drivers.find(driver => driver.name === driverName)
  if (!driver) {
    throw new Error('Driver not found')
  }
  return driver.driver.getItem(key)
}

export async function hasItem(fileName: string) {
  if(!fileName){
    return false
  }

  const [driverName, key] = fileName.split(':')
  const driver = drivers.find(driver => driver.name === driverName)
  if (!driver) {
    throw new Error('Driver not found')
  }
  const keys = await driver.driver.keys()
  return keys.includes(key)
}

export function getPathType(path: string) {
  if (!path) {
    return null
  }

  return path.includes(':') ? 'file' : 'driver'
}

export function getFileName(path: string) {
  return path.split(':').pop()
}

export function getDriverName(path: string) {
  return path.split(':').shift()
}


import { writeSetting, getSetting } from "./stores";
import { ts2js, ts2Module } from "./lang";

export const currentFile = writable(getSetting('currentFile') || null);

currentFile.subscribe(async (value) => {
  writeSetting('currentFile', value);
})


let fsChangedId = 0;
export const fsChanged = writable(fsChangedId);

export async function updateFs() {
  fsChanged.set(++fsChangedId);
}

export async function updateIndex(fileNameRaw) {
  const fileName = getFileName(fileNameRaw);
  const driverName = getDriverName(fileNameRaw);

  if (!fileName) {
    return;
  }

  if(fileName === '__index__'){
    updateFs();
    return
  }

  const text = await getItem(fileNameRaw);

  if (!text) {
    return;
  }

  // load module
  const module = await ts2Module(text as string);

  // const oldIndex = JSON.parse((await getItem(driverName + ':__index__')) as string || '{}');
  let oldIndex = {};
  try {
    oldIndex = JSON.parse((await getItem(driverName + ':__index__')) as string || '{}');
  } catch (e) {
    console.error(e);
  }
  



  const newIndex = {
    ...oldIndex,
    [fileName]: module?.meta
  }

  // update index
  await setItem(driverName + ':__index__', JSON.stringify(newIndex, null, 2)); 

  await updateFs();

}