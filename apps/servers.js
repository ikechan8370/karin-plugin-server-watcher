import {Bot, plugin, segment} from '#Karin'
import Cfg from '../lib/config.js'
import {NezhaClient} from "../models/nezha.js";
import common from "../../../lib/common/common.js";

export class Servers extends plugin {
  constructor () {
    super({
      // 必选 插件名称
      name: 'Servers',
      // 插件描述
      dsc: '查看集群状态',
      // 监听消息事件 默认message
      event: 'message',
      // 优先级
      priority: 5000,
      // 以下rule、task、button、handler均为可选，如键入，则必须为数组
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#(servers|服务器)$',
          /** 执行方法 */
          fnc: 'servers',
          //  是否显示操作日志 true=是 false=否
          log: true,
          // 权限 master,owner,admin,all
          permission: 'master'
        }
      ]
    })
  }

  async servers () {
    let client = new NezhaClient(Cfg.Nezha)
    let servers = await client.listServers()
    let msg = segment.text('服务器列表：\n')
    let serverMsgs = servers.map(server => {
      return `服务器id：${server.id}\n服务器名称：${server.name}\n服务器分类：${server.tag}\n上次活跃时间：${server.last_active}\n`
    }).map(msg => segment.text(msg))
    let nodes = common.makeForward([msg, ...serverMsgs])
    this.reply(nodes)
  }

}
