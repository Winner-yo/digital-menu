import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { DayOfWeek, PrismaClient, UserRole } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123!', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@habesha.com' },
    update: {},
    create: {
      email: 'owner@habesha.com',
      password,
      firstName: 'Abebe',
      lastName: 'Kebede',
      phone: '+251911000001',
      role: UserRole.RESTAURANT_OWNER,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'habesha-restaurant' },
    update: {},
    create: {
      slug: 'habesha-restaurant',
      name: 'Habesha Restaurant',
      nameAmharic: 'ሀበሻ ሬስቶራንት',
      description: 'Traditional Ethiopian dishes, coffee, and injera in Addis Ababa.',
      descriptionAmharic: 'ባህላዊ የኢትዮጵያ ምግቦች፣ ቡና እና እንጀራ በአዲስ አበባ።',
      phone: '+251911234567',
      email: 'hello@habesha.com',
      address: 'Bole Road, Addis Ababa',
      city: 'Addis Ababa',
      taxRate: 15,
      serviceCharge: 10,
      minimumOrderAmount: 150,
      isVerified: true,
    },
  });

  await prisma.restaurantUser.upsert({
    where: {
      restaurantId_userId: { restaurantId: restaurant.id, userId: owner.id },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      userId: owner.id,
      role: UserRole.RESTAURANT_OWNER,
    },
  });

  const days: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ];

  for (const day of days) {
    await prisma.openingHour.upsert({
      where: { restaurantId_day: { restaurantId: restaurant.id, day } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        day,
        openTime: '08:00',
        closeTime: '22:00',
        isClosed: false,
      },
    });
  }

  await prisma.table.upsert({
    where: {
      restaurantId_tableNumber: { restaurantId: restaurant.id, tableNumber: '1' },
    },
    update: {},
    create: { restaurantId: restaurant.id, tableNumber: '1', capacity: 4 },
  });

  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { restaurantId: restaurant.id, title: 'Welcome to Habesha' },
  });
  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        restaurantId: restaurant.id,
        title: 'Welcome to Habesha',
        titleAmharic: 'እንኳን ወደ ሀበሻ በደህና መጡ',
        body: 'Try our combo platters and Ethiopian coffee ceremony.',
        bodyAmharic: 'የኮምቦ ሳህኖችን እና የቡና ሥነ ሥርዓትን ይሞክሩ።',
        isActive: true,
      },
    });
  }

  const categories = [
    {
      name: 'Traditional',
      nameAmharic: 'ባህላዊ',
      description: 'Signature Ethiopian platters',
      sortOrder: 1,
    },
    {
      name: 'Vegetarian',
      nameAmharic: 'የጾም',
      description: 'Fasting and vegetable dishes',
      sortOrder: 2,
    },
    {
      name: 'Meat',
      nameAmharic: 'የፍስክ',
      description: 'Beef, chicken, and lamb',
      sortOrder: 3,
    },
    {
      name: 'Breakfast',
      nameAmharic: 'ቁርስ',
      description: 'Morning Ethiopian favorites',
      sortOrder: 5,
    },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    const existing = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: category.name },
    });
    const saved = existing
      ? existing
      : await prisma.menuCategory.create({
          data: { restaurantId: restaurant.id, ...category },
        });
    categoryIds[category.name] = saved.id;
  }

  const items = [
    {
      category: 'Traditional',
      name: 'Doro Wat',
      nameAmharic: 'ዶሮ ወጥ',
      description: 'Spicy chicken stew with berbere, served with injera.',
      price: 420,
      isPopular: true,
      isBestseller: true,
      isSpicy: true,
      spicyLevel: 3,
      image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800',
    },
    {
      category: 'Traditional',
      name: 'Combo Platter',
      nameAmharic: 'ኮምቦ ሳህን',
      description: 'A mix of meat and vegetarian wats on injera.',
      price: 480,
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1511910849309-0dffb208c28b?w=800',
    },
    {
      category: 'Vegetarian',
      name: 'Misir Wat',
      nameAmharic: 'ምስር ወጥ',
      description: 'Red lentil stew simmered with berbere and spices.',
      price: 220,
      isVegetarian: true,
      isVegan: true,
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    },
    {
      category: 'Vegetarian',
      name: 'Shiro',
      nameAmharic: 'ሽሮ',
      description: 'Chickpea flour stew, a fasting favorite.',
      price: 200,
      isVegetarian: true,
      isVegan: true,
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    },
    {
      category: 'Meat',
      name: 'Kitfo',
      nameAmharic: 'ክትፎ',
      description: 'Minced beef with mitmita and niter kibbeh.',
      price: 450,
      isPopular: true,
      isSpicy: true,
      spicyLevel: 2,
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
    },
    {
      category: 'Meat',
      name: 'Tibs',
      nameAmharic: 'ጥብስ',
      description: 'Sautéed beef with onions, rosemary, and peppers.',
      price: 380,
      isBestseller: true,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    },
    {
      category: 'Drinks',
      name: 'Ethiopian Coffee',
      nameAmharic: 'ቡና',
      description: 'Freshly roasted beans served in a jebena.',
      price: 80,
      isVegetarian: true,
      isVegan: true,
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    },
    {
      category: 'Drinks',
      name: 'Fresh Juice',
      nameAmharic: 'ጭማቂ',
      description: 'Seasonal fruit juice — mango, avocado, or mixed.',
      price: 90,
      isVegetarian: true,
      isVegan: true,
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800',
    },
    {
      category: 'Traditional',
      name: 'Beyaynetu',
      nameAmharic: 'በያይነቱ',
      description: 'Colorful vegetarian combination platter on injera.',
      price: 280,
      isVegetarian: true,
      isVegan: true,
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    },
    {
      category: 'Traditional',
      name: 'Firfir',
      nameAmharic: 'ፍርፍር',
      description: 'Shredded injera tossed in spiced wat.',
      price: 180,
      isVegetarian: true,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    },
    {
      category: 'Meat',
      name: 'Dulet',
      nameAmharic: 'ዱለት',
      description: 'Minced tripe and liver with mitmita and kibe.',
      price: 320,
      isSpicy: true,
      spicyLevel: 2,
      image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    },
    {
      category: 'Vegetarian',
      name: 'Gomen',
      nameAmharic: 'ጎመን',
      description: 'Collard greens sautéed with garlic and spices.',
      price: 160,
      isVegetarian: true,
      isVegan: true,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    },
    {
      category: 'Vegetarian',
      name: 'Alicha Wat',
      nameAmharic: 'አልጫ ወጥ',
      description: 'Mild turmeric stew with vegetables or chicken.',
      price: 240,
      isVegetarian: true,
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    },
    {
      category: 'Breakfast',
      name: 'Chechebsa',
      nameAmharic: 'ቆጮ',
      description: 'Torn kitta bread with berbere and niter kibbeh.',
      price: 150,
      isVegetarian: true,
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    },
    {
      category: 'Breakfast',
      name: 'Ful',
      nameAmharic: 'ፉል',
      description: 'Fava beans with onion, tomato, and injera or bread.',
      price: 140,
      isVegetarian: true,
      isVegan: true,
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    },
    {
      category: 'Drinks',
      name: 'Macchiato',
      nameAmharic: 'ማክያቶ',
      description: 'Ethiopian espresso with a splash of steamed milk.',
      price: 70,
      isVegetarian: true,
      image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
    },
    {
      category: 'Drinks',
      name: 'Avocado Juice',
      nameAmharic: 'አቮካዶ ጭማቂ',
      description: 'Creamy avocado juice, a local favorite.',
      price: 100,
      isVegetarian: true,
      isVegan: true,
      image: 'https://images.unsplash.com/photo-1623065424072-4ce1e0b0d0b2?w=800',
    },
  ];

  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({
      where: { restaurantId: restaurant.id, name: item.name },
    });
    if (existing) continue;

    const { category, ...data } = item;
    if (!categoryIds[category]) continue;
    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: categoryIds[category],
        ...data,
      },
    });
  }

  for (const tableNumber of ['2', '3', '4', '5', '6']) {
    await prisma.table.upsert({
      where: {
        restaurantId_tableNumber: { restaurantId: restaurant.id, tableNumber },
      },
      update: {},
      create: { restaurantId: restaurant.id, tableNumber, capacity: 4 },
    });
  }

  const existingZone = await prisma.deliveryZone.findFirst({
    where: { restaurantId: restaurant.id, name: 'Bole' },
  });
  if (!existingZone) {
    await prisma.deliveryZone.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Bole',
        areas: ['Bole', 'Airport', 'Meskel Square', 'Kazanchis'],
        deliveryFee: 80,
        minimumOrder: 200,
        estimatedTime: 35,
      },
    });
  }

  await prisma.promoCode.upsert({
    where: {
      restaurantId_code: { restaurantId: restaurant.id, code: 'WELCOME10' },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      code: 'WELCOME10',
      description: '10% off first orders',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minimumOrder: 200,
      maxDiscount: 80,
      isActive: true,
    },
  });

  console.log('Seed complete.');
  console.log('Demo restaurant: http://localhost:3000/menu/habesha-restaurant');
  console.log('Owner login: owner@habesha.com / Password123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
