import {Bot, plugin, segment} from '#Karin'
import Cfg from '../lib/config.js'
import { NezhaClient } from '../models/nezha.js'
import common from '../../../lib/common/common.js'
import {check, TYPE_MAP, TYPES} from '../task/check.js'

export class Servers extends plugin {
  /**
   * event
   * @type {KarinMessage}
   */
  e
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
          reg: '^#(servers|服务器)',
          /** 执行方法 */
          fnc: 'servers',
          //  是否显示操作日志 true=是 false=否
          log: true,
          // 权限 master,owner,admin,all
          permission: 'master'
        }
      ],
      task: [
        {
          name: '检查服务器状态推送',
          // 每5分钟检查一次
          cron: '*/5 * * * *',
          fnc: 'checkServers',
          log: false
        }
      ]
    })
  }

  async servers () {
    let msg = this.e.msg
    let tag = msg.replace(/^#(servers|服务器)/, '')
    try {
      let client = new NezhaClient(Cfg.Nezha)
      let servers = await client.listServers(tag)
      if (servers.length === 0) {
        if (tag) {
          this.reply('当前无服务器，请检查该tag是否存在', { reply: true })
        } else {
          this.reply('当前无服务器', { reply: true })
        }
        return
      }
      let msg = segment.text('服务器列表：\n')
      let serverMsgs = servers
        .sort((a, b) => a.id - b.id)
        .map(server => {
          return `服务器id：${server.id}\n服务器名称：${server.name}\n服务器分类：${server.tag}\n上次活跃时间：${server.last_active}\n`
        }).map(msg => segment.text(msg))
      let nodes = common.makeForward([msg, ...serverMsgs])
      this.reply(nodes)
    } catch (err) {
      logger.error(err)
      this.reply(err.message)
    }
  }

  async checkServers () {
    let summaries = await check()
    logger.debug(summaries)
    let toSend = '服务器监测汇报\n'
    summaries.forEach(sum => {
      TYPES.forEach(type => {
        /**
         * @type {{server: ServerDetail, last: number, currentValue: number, type: 'alert' | 'unalert'}}
         */
        let record = sum[type]
        if (record) {
          if (record.type === 'alert') {
            toSend += `服务器${record.server.name}(${record.server.id}) ${TYPE_MAP[type]}超过阈值，当前值${record.currentValue}，已持续${record.last}秒\n`
          } else {
            toSend += `服务器${record.server.name}(${record.server.id}) ${TYPE_MAP[type]}恢复正常，当前值${record.currentValue}\n`
          }
        }
      })
    })
    let send = Cfg.Nezha.send
    for (let botId of Object.keys(send)) {
      let bot = Bot.adapter[botId]
      if (!bot) {
        logger.error(`找不到bot ${botId}`)
        continue
      }
      send[botId].private?.forEach(id => {
        let contact = {
          scene: 'private',
          peer: id
        }
        bot.SendMessage(contact, [segment.text(toSend)])
      })
      send[botId].group?.forEach(groupId => {
        let contact = {
          scene: 'group',
          peer: groupId
        }
        bot.SendMessage(contact, [segment.text(toSend)])
      })
    }
  }
}
