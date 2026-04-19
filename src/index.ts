/*
 * @Author: Kabuda-czh
 * @Date: 2023-02-16 11:35:25
 * @LastEditors: Kabuda-czh
 * @LastEditTime: 2023-02-16 18:28:16
 * @FilePath: \koishi-plugin-status-pro\src\index.ts
 * @Description: 
 * 
 * Copyright (c) 2023 by Kabuda-czh, All Rights Reserved.
 */
import { Context, Logger, Schema, segment, version } from 'koishi'
import { getSystemInfo } from './neko/utils';
import {} from "koishi-plugin-puppeteer";
import { Page } from "puppeteer-core";
import { existsSync } from 'fs';
import { resolve } from 'path';

export const name = 'status-pro'
export const inject = ['puppeteer'] as const

export interface Config {
  botName?: string
  command?: string
  authority?: number
}

export const Config: Schema<Config> = Schema.object({
  botName: Schema.string().default('koishi').description("机器人名称(默认: koishi)"),
  command: Schema.string().default('自检').description("自检指令自定义(默认: 自检)"),
  authority: Schema.number().default(1).description("自检指令使用权限(默认: 1)"),
})

export const logger = new Logger("status-pro");

interface DashboardItem {
  progress: number
  title: string
}

interface InformationItem {
  key: string
  value: string
}

interface RenderInfo {
  name: string
  dashboard: DashboardItem[]
  information: InformationItem[]
  footer: string
}

export function apply(ctx: Context, config: Config) {
  ctx.command(config.command || "自检", "检查机器人状态", { authority: config.authority || 1 })
    .action(async ({ session }) => {
      const systemInfo = await getSystemInfo(config.botName || "koishi", version, ctx.registry.size) as RenderInfo;

      let page: Page | undefined;
      try {
        page = await ctx.puppeteer.page();
        await page.setViewport({ width: 1920 * 2, height: 1080 * 2 });
        const templateInLib = resolve(__dirname, './neko/template.html')
        const templateInSrc = resolve(__dirname, '../src/neko/template.html')
        const templatePath = existsSync(templateInLib) ? templateInLib : templateInSrc
        await page.goto(`file:///${templatePath}`)
        await page.waitForNetworkIdle();

        await page.evaluate((payload: RenderInfo) => {
          const createElement = (markup: string) => {
            const doc = new DOMParser().parseFromString(markup, 'text/html')
            return doc.body.firstElementChild as HTMLElement | null
          }

          const nameNode = document.querySelector<HTMLElement>('#config_name')
          const dashboardNode = document.querySelector<HTMLElement>('#config_dashboard')
          const informationNode = document.querySelector<HTMLElement>('#config_information')
          const footerNode = document.querySelector<HTMLElement>('#config_footer')
          const dashboardColor = ['var(--main-color)', '#ffb3cc', '#fcaa93', '#b7a89e']

          if (!nameNode || !dashboardNode || !informationNode || !footerNode) return

          dashboardNode.innerHTML = ''
          informationNode.innerHTML = ''

          nameNode.innerHTML = payload.name
          footerNode.innerHTML = payload.footer

          payload.dashboard.forEach((item, index) => {
            const element = createElement(`
              <li class="__dashboard-block __cpu" style="--block-color: ${dashboardColor[index] || dashboardColor[0]}">
                <svg
                  width="102"
                  height="102"
                  viewBox="0 0 200 200"
                  class="__dashboard-block__progress circle-progress"
                  style="--progress: ${item.progress}; --color: var(--block-color)"
                >
                  <circle
                    class="circle-progress-bar"
                    stroke-linecap="round"
                    cx="100"
                    cy="100"
                    r="94"
                    fill="none"
                    transform="rotate(-93.8 100 100)"
                    stroke-width="12"
                  />
                </svg>
                <div class="__dashboard-block__info">
                  <p class="__dashboard-block__info__value">${item.title}</p>
                </div>
              </li>
            `)
            if (element) dashboardNode.append(element)
          })

          payload.information.forEach((item) => {
            const element = createElement(`
              <li class="__information-block">
                <span class="__information-block__key">${item.key}</span>
                <span class="__information-block__value">${item.value}</span>
              </li>
            `)
            if (element) informationNode.append(element)
          })
        }, systemInfo)

        const element = await page.$("#background-page");
        if (!element) return '渲染失败: 未找到背景节点'
        return (
          segment.image(await element.screenshot({
            encoding: "binary"
          }), "image/png")
        );
      } catch (e) {
        logger.error("状态渲染失败: ", e);
        const message = e instanceof Error ? e.message : String(e)
        return "渲染失败" + message;
      } finally {
        page?.close();
      }
    });
}