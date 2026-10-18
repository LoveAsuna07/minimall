import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type CategorySeed = {
  id: string;
  name: string;
  slug: string;
};

type ProductSeed = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categorySlug: string;
  imageSeed: string;
};

const categories: CategorySeed[] = [
  { id: "cat-digital", name: "数码产品", slug: "digital" },
  { id: "cat-home", name: "家居生活", slug: "home" },
  { id: "cat-fashion", name: "服饰鞋包", slug: "fashion" },
  { id: "cat-food", name: "食品饮料", slug: "food" },
];

const products: ProductSeed[] = [
  {
    id: "prod-001",
    name: "无线降噪耳机",
    description: "主动降噪，续航 30 小时，适合通勤与远程办公。",
    price: 49900,
    stock: 25,
    categorySlug: "digital",
    imageSeed: "minimall-01",
  },
  {
    id: "prod-002",
    name: "机械键盘",
    description: "87 键紧凑布局，热插拔轴体，支持有线与蓝牙双模。",
    price: 32900,
    stock: 40,
    categorySlug: "digital",
    imageSeed: "minimall-02",
  },
  {
    id: "prod-003",
    name: "便携充电宝",
    description: "10000mAh 容量，支持 22.5W 快充，可同时为两台设备充电。",
    price: 12900,
    stock: 60,
    categorySlug: "digital",
    imageSeed: "minimall-03",
  },
  {
    id: "prod-004",
    name: "香薰蜡烛",
    description: "天然大豆蜡与木质香调，燃烧时间约 40 小时。",
    price: 8900,
    stock: 30,
    categorySlug: "home",
    imageSeed: "minimall-04",
  },
  {
    id: "prod-005",
    name: "亚麻抱枕",
    description: "水洗亚麻面料，柔软透气，45 × 45cm 标准尺寸。",
    price: 5900,
    stock: 50,
    categorySlug: "home",
    imageSeed: "minimall-05",
  },
  {
    id: "prod-006",
    name: "陶瓷马克杯",
    description: "手工釉面，容量 350ml，可用于微波炉与洗碗机。",
    price: 4900,
    stock: 80,
    categorySlug: "home",
    imageSeed: "minimall-06",
  },
  {
    id: "prod-007",
    name: "纯棉基础 T 恤",
    description: "260g 精梳棉，宽松版型，适合日常叠穿。",
    price: 7900,
    stock: 100,
    categorySlug: "fashion",
    imageSeed: "minimall-07",
  },
  {
    id: "prod-008",
    name: "轻量连帽卫衣",
    description: "毛圈棉面料，落肩剪裁，春秋季单穿或内搭皆可。",
    price: 19900,
    stock: 35,
    categorySlug: "fashion",
    imageSeed: "minimall-08",
  },
  {
    id: "prod-009",
    name: "帆布托特包",
    description: "加厚帆布，内置小口袋，可容纳 14 英寸笔记本。",
    price: 9900,
    stock: 45,
    categorySlug: "fashion",
    imageSeed: "minimall-09",
  },
  {
    id: "prod-010",
    name: "手工曲奇礼盒",
    description: "黄油曲奇四种口味组合，独立包装，适合作为伴手礼。",
    price: 6800,
    stock: 20,
    categorySlug: "food",
    imageSeed: "minimall-10",
  },
  {
    id: "prod-011",
    name: "冷萃咖啡液",
    description: "中深烘焙，单份 30ml，加冰水或牛奶即可饮用。",
    price: 9900,
    stock: 70,
    categorySlug: "food",
    imageSeed: "minimall-11",
  },
  {
    id: "prod-012",
    name: "坚果能量棒",
    description: "混合坚果与燕麦，低糖配方，每盒 6 支。",
    price: 3900,
    stock: 120,
    categorySlug: "food",
    imageSeed: "minimall-12",
  },
];

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    // 优先按固定 id 匹配；兼容旧数据中由后台修改过 slug 或名称的情况
    const existing =
      (await prisma.category.findUnique({ where: { id: category.id } })) ??
      (await prisma.category.findFirst({
        where: {
          OR: [{ slug: category.slug }, { name: category.name }],
        },
      }));

    const record = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: { name: category.name, slug: category.slug },
        })
      : await prisma.category.create({ data: category });

    categoryIds.set(category.slug, record.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`未知分类：${product.categorySlug}`);
    }

    const data = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: `https://picsum.photos/seed/${product.imageSeed}/800/800`,
      categoryId,
      active: true,
    };

    await prisma.product.upsert({
      where: { id: product.id },
      update: data,
      create: { id: product.id, ...data },
    });
  }

  const adminPasswordHash = await hash("Admin123456", 10);
  const userPasswordHash = await hash("User123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@minimall.test" },
    update: { name: "管理员", role: "ADMIN", passwordHash: adminPasswordHash },
    create: {
      email: "admin@minimall.test",
      name: "管理员",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@minimall.test" },
    update: { name: "普通用户", role: "USER", passwordHash: userPasswordHash },
    create: {
      email: "user@minimall.test",
      name: "普通用户",
      role: "USER",
      passwordHash: userPasswordHash,
    },
  });

  console.log(
    `种子数据完成：${categories.length} 个分类，${products.length} 件商品，2 个演示账号`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
