import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { addDays, subDays } from 'date-fns';
import * as schema from './schema';
import type { ApplicationStatus, Priority } from '@/lib/enums';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log('Seeding...');

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const [user] = await db
    .insert(schema.users)
    .values({
      name: '演示用户',
      email: 'demo@jobflow.local',
      passwordHash,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { name: '演示用户', passwordHash },
    })
    .returning();

  if (!user) throw new Error('failed to upsert demo user');
  console.log('  user:', user.email);

  // 重新灌入演示数据，确保多次 seed 结果一致。
  await client`delete from applications where user_id = ${user.id}`;
  await client`delete from companies where user_id = ${user.id}`;

  const companySeeds = [
    {
      name: '腾讯',
      industry: '社交 / 游戏 / 支付',
      location: '深圳',
      careersUrl: 'https://careers.tencent.com/',
    },
    {
      name: '阿里巴巴',
      industry: '电商 / 云计算',
      location: '杭州',
      careersUrl: 'https://talent.alibaba.com/',
    },
    {
      name: '字节跳动',
      industry: '内容平台 / AI',
      location: '北京',
      careersUrl: 'https://jobs.bytedance.com/',
    },
    {
      name: '美团',
      industry: '本地生活',
      location: '北京',
      careersUrl: 'https://zhaopin.meituan.com/',
    },
    {
      name: '京东',
      industry: '零售 / 供应链',
      location: '北京',
      careersUrl: 'https://zhaopin.jd.com/',
    },
  ] as const;

  const companyRows = await db
    .insert(schema.companies)
    .values(
      companySeeds.map((company) => ({
        userId: user.id,
        name: company.name,
        industry: company.industry,
        location: company.location,
      }))
    )
    .returning();

  const byName = Object.fromEntries(companyRows.map((company) => [company.name, company]));
  const careerSiteByName = Object.fromEntries(companySeeds.map((company) => [company.name, company.careersUrl]));

  const now = new Date();
  type Seed = {
    company: keyof typeof byName;
    title: string;
    status: ApplicationStatus;
    priority: Priority;
    deadlineOffset: number | null;
    appliedOffset: number | null;
    boardOrder: number;
    source: string;
  };

  const seeds: Seed[] = [
    {
      company: '腾讯',
      title: '后端开发工程师（微信支付）实习生',
      status: 'wishlist',
      priority: 'high',
      deadlineOffset: 14,
      appliedOffset: null,
      boardOrder: 0,
      source: '官网直投',
    },
    {
      company: '字节跳动',
      title: '推荐算法工程师实习生',
      status: 'wishlist',
      priority: 'high',
      deadlineOffset: 21,
      appliedOffset: null,
      boardOrder: 1,
      source: '官网直投',
    },
    {
      company: '阿里巴巴',
      title: '前端开发工程师实习生',
      status: 'applied',
      priority: 'medium',
      deadlineOffset: 7,
      appliedOffset: -2,
      boardOrder: 0,
      source: '内推',
    },
    {
      company: '美团',
      title: '商业分析实习生',
      status: 'applied',
      priority: 'medium',
      deadlineOffset: 5,
      appliedOffset: -3,
      boardOrder: 1,
      source: 'BOSS 直聘',
    },
    {
      company: '京东',
      title: '测试开发工程师实习生',
      status: 'oa',
      priority: 'high',
      deadlineOffset: 3,
      appliedOffset: -7,
      boardOrder: 0,
      source: '官网直投',
    },
    {
      company: '腾讯',
      title: '服务端开发工程师（QQ 音乐）实习生',
      status: 'interview',
      priority: 'high',
      deadlineOffset: null,
      appliedOffset: -14,
      boardOrder: 0,
      source: '内推',
    },
    {
      company: '阿里巴巴',
      title: '产品经理实习生',
      status: 'interview',
      priority: 'medium',
      deadlineOffset: null,
      appliedOffset: -10,
      boardOrder: 1,
      source: '官网直投',
    },
    {
      company: '美团',
      title: '数据分析实习生',
      status: 'hr',
      priority: 'high',
      deadlineOffset: null,
      appliedOffset: -21,
      boardOrder: 0,
      source: '官网直投',
    },
    {
      company: '京东',
      title: '后端开发工程师（供应链方向）实习生',
      status: 'offer',
      priority: 'high',
      deadlineOffset: null,
      appliedOffset: -28,
      boardOrder: 0,
      source: '官网直投',
    },
    {
      company: '字节跳动',
      title: '平台研发工程师实习生',
      status: 'rejected',
      priority: 'low',
      deadlineOffset: null,
      appliedOffset: -35,
      boardOrder: 0,
      source: '官网直投',
    },
    {
      company: '腾讯',
      title: '产品运营实习生',
      status: 'archived',
      priority: 'low',
      deadlineOffset: null,
      appliedOffset: -60,
      boardOrder: 0,
      source: '招聘会',
    },
  ];

  const inserted = await db
    .insert(schema.applications)
    .values(
      seeds.map((seed) => ({
        userId: user.id,
        companyId: byName[seed.company]!.id,
        title: seed.title,
        currentStatus: seed.status,
        priority: seed.priority,
        boardOrder: seed.boardOrder,
        deadlineAt: seed.deadlineOffset != null ? addDays(now, seed.deadlineOffset) : null,
        appliedAt: seed.appliedOffset != null ? addDays(now, seed.appliedOffset) : null,
        location: byName[seed.company]!.location,
        source: seed.source,
        sourceUrl: careerSiteByName[seed.company],
      }))
    )
    .returning();

  const findApp = (companyName: string, title: string) =>
    inserted.find((application) => application.title === title && application.companyId === byName[companyName]!.id)!;

  const tencentBackend = findApp('腾讯', '服务端开发工程师（QQ 音乐）实习生');
  const jdOa = findApp('京东', '测试开发工程师实习生');
  const meituanHr = findApp('美团', '数据分析实习生');
  const jdOffer = findApp('京东', '后端开发工程师（供应链方向）实习生');
  const bytedanceRejected = findApp('字节跳动', '平台研发工程师实习生');

  await db.insert(schema.applicationEvents).values([
    {
      applicationId: tencentBackend.id,
      eventType: 'oa',
      title: '在线笔试已完成',
      startsAt: subDays(now, 10),
      status: 'done',
    },
    {
      applicationId: tencentBackend.id,
      eventType: 'interview',
      title: '一面技术面（QQ 音乐）',
      startsAt: addDays(now, 2),
      endsAt: addDays(now, 2),
      reminderAt: addDays(now, 1),
    },
    {
      applicationId: jdOa.id,
      eventType: 'oa',
      title: '在线测评截止',
      startsAt: addDays(now, 3),
      reminderAt: addDays(now, 2),
    },
    {
      applicationId: meituanHr.id,
      eventType: 'interview',
      title: 'HR 面',
      startsAt: addDays(now, 5),
      reminderAt: addDays(now, 4),
    },
    {
      applicationId: jdOffer.id,
      eventType: 'offer_response',
      title: 'Offer 签约截止',
      startsAt: addDays(now, 7),
      reminderAt: addDays(now, 5),
    },
    {
      applicationId: bytedanceRejected.id,
      eventType: 'interview',
      title: '现场面试（已结束）',
      startsAt: subDays(now, 25),
      status: 'done',
    },
  ]);

  await db.insert(schema.applicationNotes).values([
    {
      applicationId: tencentBackend.id,
      noteType: 'followup',
      content: '通过牛客联系到组内学长，补充确认了技术栈、面试轮次和业务方向。',
    },
    {
      applicationId: meituanHr.id,
      noteType: 'interview_feedback',
      content: 'HR 沟通顺畅，预计一周内给到后续安排。',
    },
  ]);

  await db.insert(schema.offers).values([
    {
      applicationId: jdOffer.id,
      baseSalary: '月薪 18k x 16',
      bonus: '签字费 10k / 年终另计',
      location: '北京 · 亦庄',
      team: '零售技术 - 供应链平台',
      responseDeadlineAt: addDays(now, 7),
      decisionStatus: 'pending',
      pros: '业务体量大，后端链路完整，团队方向和实习经历匹配。',
      cons: '通勤时间偏长，另一条业务线的流程还没结束。',
    },
  ]);

  const materialRows = await db
    .insert(schema.materials)
    .values([
      {
        userId: user.id,
        type: 'resume',
        name: '2026 春招简历 - 后端研发',
        version: 'v3',
        fileUrl: 'https://assets.jobflow.demo.cn/resume-backend-v3.pdf',
        tags: ['后端', '中文'],
        notes: '突出 Go / Java / MySQL 项目，补齐实习与竞赛经历。',
      },
      {
        userId: user.id,
        type: 'resume',
        name: '2026 春招简历 - 通用版',
        version: 'v2',
        fileUrl: 'https://assets.jobflow.demo.cn/resume-general-v2.pdf',
        tags: ['通用', '中文'],
        notes: '保留项目主线，弱化与当前岗位无关的经历。',
      },
      {
        userId: user.id,
        type: 'cover_letter',
        name: '美团岗位定制求职信',
        version: 'v1',
        fileUrl: 'https://assets.jobflow.demo.cn/cover-meituan-v1.pdf',
        tags: ['定制化'],
        notes: null,
      },
    ])
    .returning();

  const backendResume = materialRows.find((material) => material.name === '2026 春招简历 - 后端研发')!;
  const meituanCover = materialRows.find((material) => material.name === '美团岗位定制求职信')!;

  await db.insert(schema.applicationMaterials).values([
    { applicationId: tencentBackend.id, materialId: backendResume.id, purpose: '投递版本' },
    { applicationId: tencentBackend.id, materialId: meituanCover.id, purpose: '自定义附件' },
    { applicationId: jdOffer.id, materialId: backendResume.id, purpose: '投递版本' },
  ]);

  console.log(`  inserted ${inserted.length} applications`);
  console.log('Done. Sign in as demo@jobflow.local / demo1234');
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
