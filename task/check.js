import { NezhaClient } from '../models/nezha.js'
import Cfg from '../lib/config.js'
import { dirPath } from '../index.js'
import fs from 'fs'

/**
 * @typedef {'cpu' | 'memory' | 'disk' | 'upload_speed' | 'download_speed'} CheckItem
 */

/**
 * 检查，记录，返回需要预警的信息
 * @param props
 * @return {Promise<void>}
 */
export async function check (props = Cfg.Nezha) {
  let client = new NezhaClient(props)
  let servers = await client.listServers()
  let idArr = servers.map(server => server.id)
  let ids = idArr.join(',')
  let serverDetails = await client.getServerDetails(ids)

  /**
   * 本次拿到的map
   * @type {Map<number, ServerDetail>}
   */
  let map = new Map()
  serverDetails.forEach(serverDetail => {
    serverDetail.calculated.disk_rate = serverDetail.status.DiskUsed / serverDetail.host.DiskTotal
    serverDetail.calculated.memory_rate = serverDetail.status.MemUsed / serverDetail.host.MemTotal
    map.set(serverDetail.id, serverDetail)
  })

  // 读取上次留档
  let files = fs.readdirSync(`${dirPath}/data`).filter(file => file.startsWith('servers_'))
  // 找到最新的留档
  let lastFile = files.sort().pop()
  /**
   * 上次存档
   * @type {ServerDetail[]}
   */
  let lastDetails = []
  if (lastFile) {
    lastDetails = JSON.parse(fs.readFileSync(`${dirPath}/data/${lastFile}`, 'utf8'))
  }
  /**
   * 上次拿到的map
   * @type {Map<number, ServerDetail>}
   */
  let lastMap = new Map()
  lastDetails.forEach(serverDetail => {
    lastMap.set(serverDetail.id, serverDetail)
  })

  // 比较。只比较：CPU占用高于阈值、内存占用高于阈值、磁盘占用高于阈值、上传下载速度高于阈值
  let cfg = Cfg.Nezha
  let rules = cfg.check_rules
  let items = rules.items

  for (let id of idArr) {
    let rule = rules.exception[id]

    let server = map.get(id)
    let cpuRate = server.status.CPU
    let memRate = server.calculated.memory_rate
    let diskRate = server.calculated.disk_rate

    let lastServer = lastMap.get(id)
    let lastCpuRate = lastServer.status.CPU
    let lastMemRate = lastServer.calculated.memory_rate
    let lastDiskRate = lastServer.calculated.disk_rate
  }

  // 最后存入留档
  let path = `${dirPath}/data/servers_${new Date().getTime()}.json`
  fs.writeFileSync(path, JSON.stringify(serverDetails, null, 2))
}

/**
 *
 * @param {Array<{name: string, threshold: number, last_for: number, enable: number}>} defaultRule
 * @param {Array<{name: string, threshold: number?, last_for: number?, enable: number?}>?} override
 */
function overideRules (defaultRule, override = []) {

}
