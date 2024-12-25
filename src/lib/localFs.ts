import localforage from "localforage";

const defaultDrivers = [{
  name: 'Local'
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
  const [driverName, key] = fileName.split(':')
  const driver = drivers.find(driver => driver.name === driverName)
  if (!driver) {
    throw new Error('Driver not found')
  }
  const keys = await driver.driver.keys()
  return keys.includes(key)
}