import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';
import {
  getEnvFilePath,
  getRuntimeHealth,
  getRuntimeEnvIssues,
  type RuntimeIssue,
} from '../lib/runtime-env';

const command = process.argv[2] ?? 'doctor';
const projectRoot = process.cwd();
const stateDir = path.join(projectRoot, '.jobflow');
const stateFile = path.join(stateDir, 'dev-state.json');

type DevState = {
  databaseUrl: string;
};

async function main() {
  if (!['doctor', 'setup', 'start'].includes(command)) {
    console.error(`不支持的命令：${command}`);
    process.exit(1);
  }

  if (command === 'doctor') {
    await doctor();
    return;
  }

  await ensureDependencies();
  await doctor();
  await ensureDatabaseSetup();

  if (command === 'start') {
    await runCommand('npm', ['run', 'dev']);
  }
}

async function doctor() {
  const envFile = getEnvFilePath(projectRoot);
  if (!fs.existsSync(envFile)) {
    console.error('未找到 .env 文件。请先从 .env.example 复制一份，并填入真实配置。');
    process.exit(1);
  }

  loadDotenv({ path: envFile, override: true });
  const issues = getRuntimeEnvIssues(process.env);
  if (issues.length > 0) {
    printIssues(issues);
    process.exit(1);
  }

  const readiness = await getRuntimeHealth();
  if (!readiness.ok) {
    if (readiness.code === 'db_unreachable') {
      console.error('数据库连接检查未通过：无法连接到 DATABASE_URL 指向的数据库。');
      process.exit(1);
    }
    printIssues(readiness.issues);
    process.exit(1);
  }

  console.log('环境变量与数据库连接检查通过。');
}

async function ensureDependencies() {
  if (fs.existsSync(path.join(projectRoot, 'node_modules'))) {
    return;
  }
  console.log('未检测到 node_modules，开始安装依赖...');
  await runCommand('npm', ['install']);
}

async function ensureDatabaseSetup() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error('DATABASE_URL 未设置，无法初始化数据库。');
    process.exit(1);
  }

  const previous = readState();
  if (previous?.databaseUrl === databaseUrl) {
    console.log('数据库初始化状态已存在，跳过 db:push 和 db:seed。');
    return;
  }

  console.log('检测到首次初始化或数据库配置已变更，开始执行数据库初始化...');
  await runCommand('npm', ['run', 'db:push']);
  await runCommand('npm', ['run', 'db:seed']);
  writeState({ databaseUrl });
}

function readState(): DevState | null {
  if (!fs.existsSync(stateFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8')) as DevState;
  } catch {
    return null;
  }
}

function writeState(state: DevState) {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function printIssues(issues: RuntimeIssue[]) {
  console.error('环境变量检查未通过：');
  for (const issue of issues) {
    console.error(`- ${issue.message}`);
  }
}

async function runCommand(cmd: string, args: string[]) {
  const actualCmd = process.platform === 'win32' ? `${cmd}.cmd` : cmd;
  await new Promise<void>((resolve, reject) => {
    const child = spawn(actualCmd, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false,
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${cmd} ${args.join(' ')} 失败，退出码：${code ?? 'unknown'}`));
    });
    child.on('error', reject);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
