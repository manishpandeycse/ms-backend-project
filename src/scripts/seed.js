require('../config/env');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

(async () => {
  await connectDB();
  const upsert = async (data) => (await User.findOne({ email: data.email })) || User.create(data);

  await upsert({ name: 'Admin', email: process.env.ADMIN_EMAIL || 'admin@shopnest.dev', password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin' });
  const retailer = await upsert({ name: 'MS World', email: 'retailer@shopnest.dev', password: 'Retailer@123', role: 'retailer', shopName: 'MS World', retailerStatus: 'approved' });
  await upsert({ name: 'Lucky Customer', email: 'customer@shopnest.dev', password: 'Customer@123', role: 'customer' });
  await upsert({ name: 'Superb Delivery', email: 'delivery@shopnest.dev', password: 'Delivery@123', role: 'delivery' });

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany([
      // Home
      {
        name: "Elegant Modern Wall Art",
        description: "Contemporary decorative wall art designed to enhance living rooms, bedrooms, hallways, and office interiors.",
        price: 379900,
        stock: 8,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800\""
        ],
        retailer: retailer._id,
      },
      {
        name: "Artificial Indoor Green Plant",
        description: "Low-maintenance decorative artificial plant for shelves, desks, balconies, and living room corners.",
        price: 399900,
        stock: 5,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800"
        ],
        retailer: retailer._id,
      },
      {
        name: "Modern Wooden Bedside Table",
        description: "Compact bedside table with a modern wooden finish, ideal for storing books, lamps, phones, and other bedroom essentials.",
        price: 788800,
        stock: 8,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1499933374294-4584851497cc?w=800"
        ],
        retailer: retailer._id,
      },
      {
        name: "Soft Living Room Area Rug",
        description: "Decorative area rug with a soft texture and versatile design, suitable for living rooms, bedrooms, and reading corners.",
        price: 399900,
        stock: 9,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800"
        ],
        retailer: retailer._id,
      },
      {
        name: "Modern Floor Standing Mirror",
        description: "Full-length decorative mirror with a contemporary frame, perfect for bedrooms, dressing areas, and entryways.",
        price: 149900,
        stock: 4,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800"
        ],
        retailer: retailer._id,
      },

      // Home
      {
        name: "Minimalist Wooden Wall Clock",
        description: "Stylish wall clock with a clean minimalist appearance, ideal for living rooms, offices, kitchens, and bedrooms.",
        price: 599900,
        stock: 6,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800"
        ],
        retailer: retailer._id,
      },
      {
        name: "Premium Cotton Bedsheet Set",
        description: "Soft and comfortable cotton bedsheet set designed for everyday use, including matching pillow covers and an elegant pattern.",
        price: 250000,
        stock: 8,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"
        ],
        retailer: retailer._id,
      },
      {
        name: "Decorative Ceramic Flower Vase",
        description: "Premium ceramic flower vase with a contemporary finish, perfect for dining tables, shelves, bedrooms, and living room decor.",
        price: 329900,
        stock: 6,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800"
        ],
        retailer: retailer._id,
      },
      {
        name: "Modern LED Table Lamp",
        description: "Elegant modern table lamp with a minimalist design, suitable for bedside tables, study desks, and living room decoration.",
        price: 349900,
        stock: 10,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"
        ],
        retailer: retailer._id,
      },

      // Fashion
      {
        name: "DANVOUY Womens T Shirt Casual Cotton Short",
        description: "95%Cotton,5%Spandex, Features: Casual, Short Sleeve, Letter Print,V-Neck,Fashion Tees, The fabric is soft and has some stretch., Occasion: Casual/Office/Beach/School/Home/Street. Season: Spring,Summer,Autumn,Winter.",
        price: 299900,
        stock: 4,
        category: "Women's clothing",
        images: [
          "https://fakestoreapi.com/img/61pHAEJ4NML._AC_UX679_t.png"
        ],
        retailer: retailer._id,
      },


      {
        name: "Opna Women's Short Sleeve Moisture",
        description: "100% Polyester, Machine wash, 100% cationic polyester interlock, Machine Wash & Pre Shrunk for a Great Fit, Lightweight, roomy and highly breathable with moisture wicking fabric which helps to keep moisture away, Soft Lightweight Fabric with comfortable V-neck collar and a slimmer fit, delivers a sleek, more feminine silhouette and Added Comfort",
        price: 256500,
        stock: 3,
        category: "Women's clothing",
        images: [
          "https://fakestoreapi.com/img/51eg55uWmdL._AC_UX679_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "MBJ Women's Solid Short Sleeve Boat Neck V",
        description: "95% RAYON 5% SPANDEX, Made in USA or Imported, Do Not Bleach, Lightweight fabric with great stretch for comfort, Ribbed on sleeves and neckline / Double stitching on bottom hem",
        price: 369900,
        stock: 3,
        category: "Women's clothing",
        images: [
          "https://fakestoreapi.com/img/71z3kpMAYsL._AC_UY879_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "Rain Jacket Women Windbreaker Striped Climbing Raincoats",
        description: "Lightweight perfet for trip or casual wear---Long sleeve with hooded, adjustable drawstring waist design. Button and zipper front closure raincoat, fully stripes Lined and The Raincoat has 2 side pockets are a good size to hold all kinds of things, it covers the hips, and the hood is generous but doesn't overdo it.Attached Cotton Lined Hood with Adjustable Drawstrings give it a real styled look.",
        price: 588900,
        stock: 4,
        category: "Women's clothing",
        images: [
          "https://fakestoreapi.com/img/71HblAHs5xL._AC_UY879_-2t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "Lock and Love Women's Removable Hooded Faux Leather Moto Biker Jacket",
        description: "100% POLYURETHANE(shell) 100% POLYESTER(lining) 75% POLYESTER 25% COTTON (SWEATER), Faux leather material for style and comfort / 2 pockets of front, 2-For-One Hooded denim style faux leather jacket, Button detail on waist / Detail stitching at sides, HAND WASH ONLY / DO NOT BLEACH / LINE DRY / DO NOT IRON",
        price: 688900,
        stock: 8,
        category: "Women's clothing",
        images: [
          "https://fakestoreapi.com/img/81XH0e8fefL._AC_UY879_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "BIYLACLESEN Women's 3-in-1 Snowboard Jacket Winter Coats",
        description: "The Jackets is US standard size, Please choose size as your usual wear Material: 100% Polyester; Detachable Liner Fabric: Warm Fleece. Detachable Functional Liner: Skin Friendly, Lightweigt and Warm.Stand Collar Liner jacket, keep you warm in cold weather. Zippered Pockets: 2 Zippered Hand Pockets, 2 Zippered Pockets on Chest (enough to keep cards or keys)and 1 Hidden Pocket Inside.Zippered Hand Pockets and Hidden Pocket keep your things secure. Humanized Design: Adjustable and Detachable Hood and Adjustable cuff to prevent the wind and water,for a comfortable fit. 3 in 1 Detachable Design provide more convenience, you can separate the coat and inner as needed, or wear it together. It is suitable for different season and help you adapt to different climates",
        price: 587800,
        stock: 5,
        category: "Women's clothing",
        images: [
          "https://fakestoreapi.com/img/51Y5NI-I5jL._AC_UX679_t.png"
        ],
        retailer: retailer._id,
      },

      // Electronics
      {
        name: "Samsung 49-Inch CHG90 144Hz Curved Gaming Monitor (LC49HG90DMNXZA) – Super Ultrawide Screen QLED",
        description: "49 INCH SUPER ULTRAWIDE 32:9 CURVED GAMING MONITOR with dual 27 inch screen side by side QUANTUM DOT (QLED) TECHNOLOGY, HDR support and factory calibration provides stunningly realistic and accurate color and contrast 144HZ HIGH REFRESH RATE and 1ms ultra fast response time work to eliminate motion blur, ghosting, and reduce input lag",
        price: 899900,
        stock: 10,
        category: "Electronics",
        images: [
          "https://fakestoreapi.com/img/81Zt42ioCgL._AC_SX679_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "Acer SB220Q bi 21.5 inches Full HD (1920 x 1080) IPS Ultra-Thin",
        description: "21. 5 inches Full HD (1920 x 1080) widescreen IPS display And Radeon free Sync technology. No compatibility for VESA Mount Refresh Rate: 75Hz - Using HDMI port Zero-frame design | ultra-thin | 4ms response time | IPS panel Aspect ratio - 16: 9. Color Supported - 16. 7 million colors. Brightness - 250 nit Tilt angle -5 degree to 15 degree. Horizontal viewing angle-178 degree. Vertical viewing angle-178 degree 75 hertz",
        price: 667700,
        stock: 6,
        category: "Electronics",
        images: [
          "https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "Silicon Power 256GB SSD 3D NAND A55 SLC Cache Performance Boost SATA III 2.5",
        description: "3D NAND flash are applied to deliver high transfer speeds Remarkable transfer speeds that enable faster bootup and improved overall system performance. The advanced SLC Cache Technology allows performance boost and longer lifespan 7mm slim design suitable for Ultrabooks and Ultra-slim notebooks. Supports TRIM command, Garbage Collection technology, RAID, and ECC (Error Checking & Correction) to provide the optimized performance and enhanced reliability.",
        price: 765400,
        stock: 8,
        category: "Electronics",
        images: [
          "https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "SanDisk SSD PLUS 1TB Internal SSD - SATA III 6 Gb/s",
        description: "Easy upgrade for faster boot up, shutdown, application load and response (As compared to 5400 RPM SATA 2.5” hard drive; Based on published specifications and internal benchmarking tests using PCMark vantage scores) Boosts burst write performance, making it ideal for typical PC workloads The perfect balance of performance and reliability Read/write speeds of up to 535MB/s/450MB/s (Based on internal testing; Performance may vary depending upon drive capacity, host device, OS and application.)",
        price: 599900,
        stock: 5,
        category: "Electronics",
        images: [
          "https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "WD 2TB Elements Portable External Hard Drive - USB 3.0",
        description: "USB 3.0 and USB 2.0 Compatibility Fast data transfers Improve PC Performance High Capacity; Compatibility Formatted NTFS for Windows 10, Windows 8.1, Windows 7; Reformatting may be required for other operating systems; Compatibility may vary depending on user’s hardware configuration and operating system",
        price: 699900,
        stock: 5,
        category: "Electronics",
        images: [
          "https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_t.png"
        ],
        retailer: retailer._id,
      },

      // Jewelery
      {
        name: "Pierced Owl Rose Gold Plated Stainless Steel Double",
        description: "Rose Gold Plated Double Flared Tunnel Plug Earrings. Made of 316L Stainless Steel",
        price: 399900,
        stock: 5,
        category: "Jewelery",
        images: [
          "https://fakestoreapi.com/img/51UDEzMJVpL._AC_UL640_QL65_ML3_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "White Gold Plated Princess",
        description: "Classic Created Wedding Engagement Solitaire Diamond Promise Ring for Her. Gifts to spoil your love more for Engagement, Wedding, Anniversary, Valentine's Day.",
        price: 534400,
        stock: 9,
        category: "Jewelery",
        images: [
          "https://fakestoreapi.com/img/71YAIFU48IL._AC_UL640_QL65_ML3_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "Solid Gold Petite Micropave",
        description: "Satisfaction Guaranteed. Return or exchange any order within 30 days.Designed and sold by Hafeez Center in the United States. Satisfaction Guaranteed. Return or exchange any order within 30 days.",
        price: 699900,
        stock: 10,
        category: "Jewelery",
        images: [
          "https://fakestoreapi.com/img/61sbMiUnoGL._AC_UL640_QL65_ML3_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet",
        description: "From our Legends Collection, the Naga was inspired by the mythical water dragon that protects the ocean's pearl. Wear facing inward to be bestowed with love and abundance, or outward for protection.",
        price: 799900,
        stock: 6,
        category: "Jewelery",
        images: [
          "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png"
        ],
        retailer: retailer._id,
      },

      // Men's clothing
      {
        name: "Mens Casual Slim Fit",
        description: "The color could be slightly different between on the screen and in practice. / Please note that body builds vary by person, therefore, detailed size information should be reviewed below on the product description.",
        price: 175100,
        stock: 15,
        category: "Men's clothing",
        images: [
          "https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "Mens Cotton Jacket",
        description: "Great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors. Good gift choice for you or your family member. A warm hearted love to Father, husband or son in this thanksgiving or Christmas Day.",
        price: 219900,
        stock: 10,
        category: "Men's clothing",
        images: [
          "https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_t.png"
        ],
        retailer: retailer._id,
      },
      {
        name: "Mens Casual Premium Slim Fit T-Shirts",
        description: "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing. And Solid stitched shirts with round neck made for durability and a great fit for casual fashion wear and diehard baseball fans. The Henley style round neckline includes a three-button placket.",
        price: 159900,
        stock: 5,
        category: "Men's clothing",
        images: [
          "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png"
        ],
        retailer: retailer._id,
      }
    ]);
  }
  console.log('Seed complete');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
