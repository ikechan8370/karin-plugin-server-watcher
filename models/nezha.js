import axios from 'axios';

/**
 * @typedef {Object} Server
 * @property {number} id
 * @property {string} name
 * @property {string} ipv4
 * @property {string} ipv6
 * @property {string} tag
 * @property {number} last_active
 * @property {string} valid_ip
 */

/**
 * @typedef {Object} ServerDetail
 * @property {number} id
 * @property {string} name
 * @property {string} ipv4
 * @property {string} ipv6
 * @property {string} tag
 * @property {number} last_active
 * @property {string} valid_ip
 * @property {{
 *   Platform: string,
 *   PlatformVersion: string,
 *   CPU: string[],
 *   MemTotal: number,
 *   DiskTotal: number,
 *   SwapTotal: number,
 *   Arch: string,
 *   Virtualization: string,
 *   BootTime: number,
 *   CountryCode: string,
 *   Version: string
 * }} host
 * @property {{
 *  CPU: number,
 *  MemUsed: number,
 *  SwapUsed: number,
 *  DiskUsed: number,
 *  NetInTransfer: number,
 *  NetOutTransfer: number,
 *  NetInSpeed: number,
 *  NetOutSpeed: number,
 *  Uptime: number,
 *  Load1: number,
 *  Load5: number,
 *  Load15: number,
 *  TcpConnCount: number,
 *  UdpConnCount: number,
 *  ProcessCount: number
 *  }} status
 */

/**
 * 与nezha面板API交互的客户端
 */
export class NezhaClient {
  /**
   * 服务器地址
   * @type {string}
   */
  endpoint
  /**
   * API令牌
   * @type {string}
   */
  token
  /**
   * 参数
   * @param {{endpoint: string, token: string}} props
   */
  constructor(props) {
    this.endpoint = props.endpoint
    this.token = props.token
  }

  /**
   * 获取服务器列表
   *
   * @param {string?} tag
   * @return {Promise<Array<Server>>}
   */
  async listServers(tag = '') {
    let serversRsp = await axios.get(`${this.endpoint}/api/v1/server/list?tag=${tag}`, {
      headers: {
        Authorization: `${this.token}`
      }
    })
    if (serversRsp.status !== 200) throw new Error('获取服务器列表失败: ' + serversRsp.statusText)
    return serversRsp.data?.result
  }

  /**
   * 获取服务器信息
   *
   * @param {number} id
   * @return {Promise<ServerDetail>}
   */
  async getServer(id) {
    let serverRsp = await axios.get(`${this.endpoint}/api/v1/server/details?id=${id}`, {
      headers: {
        Authorization: `${this.token}`
      }
    })
    if (serverRsp.status !== 200) throw new Error('获取服务器信息失败: ' + serverRsp.statusText)
    return serverRsp.data.result
  }
}