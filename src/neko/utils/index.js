"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemInfo = void 0;
/*
 * @Author: Kabuda-czh
 * @Date: 2023-02-16 09:35:30
 * @LastEditors: Kabuda-czh
 * @LastEditTime: 2023-02-16 18:25:01
 * @FilePath: \KBot-App\plugins\status-pro\src\neko\utils\index.ts
 * @Description:
 *
 * Copyright (c) 2023 by Kabuda-czh, All Rights Reserved.
 */
const os_1 = __importDefault(require("os"));
const si = __importStar(require("systeminformation"));
const ErrorInfo = "N / A";
async function getSystemInfo(name, koishiVersion, pluginSize) {
    const promisList = await Promise.all([
        getCPUUsage(),
        si.osInfo(),
        si.cpuCurrentSpeed(),
        si.mem(),
        getDiskUsage(),
    ]);
    const { uptime } = si.time();
    const [{ cpuUsage, cpuInfo }, { distro }, { avg }, { total, used, swaptotal, swapused }, { disksize, diskused },] = promisList;
    // memory
    const memoryTotal = (total / 1024 / 1024 / 1024).toFixed(2) + " GB";
    const memoryUsed = (used / 1024 / 1024 / 1024).toFixed(2);
    const memoryUsage = (used / total).toFixed(2);
    // swap
    const swapTotal = (swaptotal / 1024 / 1024 / 1024).toFixed(2) + " GB";
    const swapUsed = (swapused / 1024 / 1024 / 1024).toFixed(2);
    const swapUsage = (swapused / swaptotal).toFixed(2);
    // disk
    const diskTotal = (disksize / 1024 / 1024 / 1024).toFixed(2) + " GB";
    const diskUsed = (diskused / 1024 / 1024 / 1024).toFixed(2);
    const diskUsage = (diskused / disksize).toFixed(2);
    const systemInfo = {
        name,
        dashboard: [
            {
                progress: +cpuUsage,
                title: `${(+cpuUsage * 100).toFixed(0)}% - ${avg}Ghz`,
            },
            {
                progress: +memoryUsage || 0,
                title: isNaN(+memoryUsed) ? ErrorInfo : `${memoryUsed} / ${memoryTotal}`,
            },
            {
                progress: +swapUsage || 0,
                title: isNaN(+swapUsed) ? ErrorInfo : `${swapUsed} / ${swapTotal}`,
            },
            {
                progress: +diskUsage || 0,
                title: isNaN(+diskUsed) ? ErrorInfo : `${diskUsed} / ${diskTotal}`,
            },
        ],
        information: [
            {
                key: "CPU",
                value: cpuInfo,
            },
            {
                key: "System",
                value: distro,
            },
            {
                key: "Version",
                value: koishiVersion,
            },
            {
                key: "Plugins",
                value: `${pluginSize} loaded`,
            },
        ],
        footer: durationTime(uptime),
    };
    return systemInfo;
}
exports.getSystemInfo = getSystemInfo;
async function getDiskUsage() {
    const disks = await si.fsSize();
    let disksize = 0, diskused = 0;
    disks.forEach((disk) => {
        disksize += disk.size;
        diskused += disk.used;
    });
    return {
        disksize,
        diskused,
    };
}
async function getCPUUsage() {
    const t1 = getCPUInfo();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const t2 = getCPUInfo();
    const idle = t2.idle - t1.idle;
    const total = t2.total - t1.total;
    const cpuUsage = (1 - idle / total).toFixed(2);
    const cpuInfo = os_1.default.cpus()[0].model;
    return {
        cpuUsage,
        cpuInfo,
    };
}
function getCPUInfo() {
    const cpus = os_1.default.cpus();
    let idle = 0;
    const total = cpus.reduce((acc, cpu) => {
        for (const type in cpu.times) {
            acc += cpu.times[type];
        }
        idle += cpu.times.idle;
        return acc;
    }, 0);
    return {
        idle,
        total,
    };
}
function durationTime(time) {
    const day = Math.floor(time / 86400);
    const hour = Math.floor((time - day * 86400) / 3600);
    const minute = Math.floor((time - day * 86400 - hour * 3600) / 60);
    return `已持续运行 ${day}天 ${hour}小时 ${minute}分钟`;
}
