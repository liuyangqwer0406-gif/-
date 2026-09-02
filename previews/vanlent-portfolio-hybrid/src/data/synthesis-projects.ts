export type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
  note: string;
  shape?: "wide" | "portrait" | "board";
};

export type ProjectChapter = {
  title: string;
  titleCn: string;
  body: string;
  images: ProjectImage[];
};

export type ProjectMotionPoster = {
  src: string;
  poster: string;
  alt: string;
  caption: string;
  note: string;
  placement: "lead" | "portrait" | "stack";
};

export type ProjectMotionSection = {
  title: string;
  titleCn: string;
  body: string;
  posters: ProjectMotionPoster[];
};

export type SynthesisProject = {
  slug: string;
  title: string;
  titleCn?: string;
  discipline: string;
  year: string;
  role: string;
  scope: string;
  status: string;
  intro: string;
  introCn: string;
  cover: ProjectImage;
  motion?: ProjectMotionSection;
  chapters: ProjectChapter[];
  closing: string;
  closingCn: string;
};

const image = (
  src: string,
  alt: string,
  caption: string,
  note: string,
  shape?: ProjectImage["shape"],
): ProjectImage => ({ src: `/portfolio-assets/${src}`, alt, caption, note, shape });

const motionPoster = (
  src: string,
  alt: string,
  caption: string,
  placement: ProjectMotionPoster["placement"],
): ProjectMotionPoster => ({
  src: `/portfolio-assets/dad/motion/${src}.mp4`,
  poster: `/portfolio-assets/dad/motion/${src}-poster.jpg`,
  alt,
  caption,
  note: "Digital motion study / 10 sec loop",
  placement,
});

export const synthesisProjects: SynthesisProject[] = [
  {
    slug: "roku-ikition",
    title: "ROKU IKITION",
    discipline: "Brand identity / Packaging / 3D",
    year: "2025",
    role: "Visual identity / Packaging / 3D",
    scope: "D&AD New Blood brief / Four-person team",
    status: "Submitted / Campus selection",
    intro: "A shared strategy translated into one recognisable system for six botanical flavours, packaging, campaign imagery and product worlds.",
    introCn: "四人团队共同确定概念、命名和六种植物风味方向；随后由我独立完成标志、包装、海报、产品主图、户外广告和三维产品场景。",
    cover: image("dad-cover.jpg", "ROKU IKITION 品牌主视觉与无酒精饮品瓶体", "Identity overview", "D&AD New Blood brief"),
    motion: {
      title: "MOTION POSTER STUDIES.",
      titleCn: "让瓶体、材质与版式进入十秒循环。",
      body: "Four short loops extend the bottle identity through rotation, material and editorial composition. The motion stays compact so the product remains the subject.",
      posters: [
        motionPoster("kinetic-sculpture", "银灰色 ROKU IKITION 瓶体在技术网格与线框结构中旋转", "01 / Kinetic sculpture", "lead"),
        motionPoster("green-industrial", "绿色 ROKU IKITION 瓶体在黑色工业海报版式中旋转", "02 / Acid industrialism", "portrait"),
        motionPoster("holographic-surface", "镭射材质 ROKU IKITION 瓶体与环形结构旋转", "03 / Holographic surface", "stack"),
        motionPoster("metallic-legacy", "金属质感 ROKU IKITION 瓶体悬浮在米白编辑版式中", "04 / Metallic legacy", "stack"),
      ],
    },
    chapters: [
      {
        title: "ONE SYSTEM, SIX FLAVOURS.",
        titleCn: "六种风味，放进同一套视觉里。",
        body: "The logo and information hierarchy establish the common structure. Botanical signals then distinguish shiso, yuzu, sansho, gyokuro, sencha and sakura without breaking the family.",
        images: [
          image("dad-packaging.jpg", "ROKU IKITION 六种植物风味包装系统", "Packaging system", "Graphic design"),
          image("dad-3d.jpg", "ROKU IKITION 瓶体与森林水景三维渲染", "Product environment", "3D modelling / Render"),
          image("dad-outdoor.jpg", "ROKU IKITION 户外广告应用", "Outdoor communication", "Campaign extension"),
        ],
      },
      {
        title: "MATERIAL CHANGES. THE MARK HOLDS.",
        titleCn: "换一束光，瓶体仍然成立。",
        body: "Water, mineral surfaces and low light test whether the bottle silhouette and label remain clear across distinct atmospheres. The 3D work is part of the visual argument, not decoration after the fact.",
        images: [
          image("dad/product-studio.jpg", "浅色背景中的 ROKU IKITION 产品渲染", "Studio bottle", "Product render"),
          image("dad/material-teal.jpg", "青绿色矿石环境中的 ROKU IKITION 瓶体", "Mineral / teal", "Material study"),
          image("dad/material-ember.jpg", "暖橙色矿石环境中的 ROKU IKITION 瓶体", "Mineral / ember", "Material study"),
          image("dad/product-water.jpg", "水面与台座上的 ROKU IKITION 瓶体", "Water / form", "Product atmosphere", "portrait"),
        ],
      },
    ],
    closing: "The proposal was submitted to D&AD New Blood and selected through the campus round. It is not presented as an official D&AD award.",
    closingCn: "项目完成了从共同策略到完整视觉系统的转译，同时保留真实结果边界。",
  },
  {
    slug: "packaging-design",
    title: "PACKAGING DESIGN",
    titleCn: "商业包装",
    discipline: "Commercial packaging / Production",
    year: "2026",
    role: "Packaging / Production artwork",
    scope: "10+ product lines / Amazon · Action",
    status: "Produced and listed",
    intro: "Fast-turnaround retail packaging built to survive colour, size, language, barcode and production changes.",
    introCn: "实习期间处理至少 10 个海外零售产品系列，其中约 8 套从视觉到印前独立完成，其余为生产前适配与上架后的版本修改。",
    cover: image("packaging-cover.jpg", "海外零售毛毯产品场景与包装视觉", "Commercial work", "Packaging / Production"),
    chapters: [
      {
        title: "DESIGN THAT REACHES THE SHELF.",
        titleCn: "在 2-3 天内完成，还要经得起生产与上架。",
        body: "Typical projects moved through two or three feedback rounds in two to three days. The task was to keep hierarchy and visual consistency intact while producing accurate multilingual files.",
        images: [
          image("packaging-mockup.jpg", "酒红色毛毯成品包装与纸质腰封", "Teddy blanket", "Finished package"),
          image("packaging-artwork.jpg", "毛毯腰封多语言印前展开稿与出血线", "Blanket sleeve", "Multilingual artwork"),
          image("packaging-care-label.jpg", "多色毛毯洗标与认证标签印前文件", "Care label system", "Five colour variants"),
          image("packaging-bear-tag.jpg", "多语言毛绒玩具吊牌正背面与刀线", "Bear hang tag", "Front / back artwork"),
        ],
      },
      {
        title: "FROM ARTWORK TO USE CONTEXT.",
        titleCn: "让每套平面稿，回到真实使用场景。",
        body: "Production artwork is paired with application views to explain structure and retail use. AI-assisted visualisations are labelled as such and are not represented as factory photography.",
        images: [
          image("packaging-source/sofa-cover-display.jpg", "沙发套系列包装与落地展示架尺寸方案", "Sofa cover display", "Production artwork"),
          image("packaging-application/sofa-cover-floor-display-v1.png", "沙发套包装落地陈列架应用样机", "Retail placement", "AI-assisted application visualisation"),
          image("packaging-source/kids-bath-mat-system.jpg", "儿童浴室地垫吊牌洗标与色彩系统", "Kids bath mat", "Tag / label / colour system"),
          image("packaging-application/kids-bath-mat-lifestyle-v1.png", "儿童浴室地垫应用样机", "Bathroom context", "AI-assisted application visualisation"),
          image("packaging-evidence/4K_floor_display_mockup_1786978159024.jpg", "家居产品落地陈列架公开展示样机", "Floor display", "Public presentation mockup"),
        ],
      },
    ],
    closing: "Accuracy, version control and readable product information were the design outcome, not invisible production chores.",
    closingCn: "从文件到货架，准确本身就是设计结果；公开页面已脱敏客户地址、条码与内部编号。",
  },
  {
    slug: "runes",
    title: "RUNES ATTACK AND DEFENSE",
    titleCn: "符文攻防战",
    discipline: "Esports event identity",
    year: "2026",
    role: "Concept / Identity / Art direction",
    scope: "Individual graduation project",
    status: "Defence grade / Excellent",
    intro: "A red-and-blue faction system and five rune families carry one esports identity across image, space, tickets and merchandise.",
    introCn: "毕业设计独立完成，以红蓝区分阵营、五类符文编码内容，并将规则延展至主视觉、户外立面、空间导视、票证与赛事周边。",
    cover: image("thesis-cover.jpg", "符文攻防战红蓝阵营活动主视觉", "Key visual", "Graduation project"),
    chapters: [
      {
        title: "THE POSTER IS ONLY THE START.",
        titleCn: "海报之后，观众还要认阵营、找方向。",
        body: "Faction colour answers who you belong to; rune families answer what kind of information you are reading. Together they create a system that remains legible beyond the key visual.",
        images: [
          image("thesis-identity.jpg", "符文攻防战色彩与识别系统", "Faction identity", "Colour / Type"),
          image("thesis-icons.jpg", "符文攻防战符文图标系统", "Rune language", "Five information families"),
          image("thesis-merch.jpg", "符文攻防战服装徽章与赛事周边", "Event merchandise", "Identity extension"),
        ],
      },
      {
        title: "ONE CODE, MANY SCALES.",
        titleCn: "同一套编码，在不同尺度继续工作。",
        body: "The same red-blue tension and rune grammar moves from outdoor façades to wayfinding, programme boards and event applications. The project is shown as digital visualisation and defence boards, not a built event.",
        images: [
          image("thesis-outdoor.jpg", "符文攻防战户外广告应用", "Outdoor system", "Campaign scale"),
          image("thesis-wayfinding.jpg", "符文攻防战赛事空间导视应用", "Spatial wayfinding", "Arena navigation"),
          image("thesis-board-system.jpg", "符文攻防战导视与区域编码系统展板", "System board", "Defence presentation"),
          image("thesis-board-application.jpg", "符文攻防战活动应用主视觉", "Application board", "Defence presentation"),
        ],
      },
    ],
    closing: "The graduation defence received an Excellent grade. Real venue testing, fabrication and audience wayfinding remain future work.",
    closingCn: "答辩结果优秀；真实场地、制作材料与观众路径尚未验证。",
  },
  {
    slug: "jiangkou",
    title: "JIANGKOU SUNKEN SILVER",
    titleCn: "江口沉银",
    discipline: "Cultural visual / 3D / Packaging",
    year: "2024",
    role: "Concept / 3D / Packaging",
    scope: "Individual competition proposal",
    status: "Competition finalist",
    intro: "Artefact modelling, metal material and controlled light reconstruct a sequence of sinking, discovery and reappearance.",
    introCn: "独立完成的博物馆文创竞赛提案，以“沉没、发现、重见”为观看顺序，处理器物建模、金属材质、场景效果图和包装视觉。",
    cover: image("jiangkou-cover-v2.jpg", "江口沉银器物三维视觉主画面", "Hero artefact", "Cultural visual / 3D"),
    chapters: [
      {
        title: "LET THE ARTEFACT SPEAK FIRST.",
        titleCn: "少用一层纹样，先把历史器物看清楚。",
        body: "The visual direction removes decorative noise and uses scale, shadow and metallic detail to focus attention on the object itself.",
        images: [
          image("jiangkou-process-v2.jpg", "江口沉银的建模与创作过程", "Model process", "Form / Material / Light"),
          image("jiangkou-renders-v2.jpg", "江口沉银器物使用场景三维渲染", "Discovery sequence", "3D scene study"),
          image("jiangkou-cover-v2.jpg", "江口沉银主视觉器物渲染", "Key visual", "Competition proposal"),
        ],
      },
    ],
    closing: "The proposal became a finalist in the 2024 Meishan Jiangkou Sunken Silver Museum cultural design competition. No physical product was fabricated.",
    closingCn: "作品入围 2024 眉山江口沉银博物馆文创设计大赛；当前成果仍为数字提案。",
  },
  {
    slug: "reverie",
    title: "REVERIE",
    titleCn: "坠入梦境",
    discipline: "Immersive web experience",
    year: "2026",
    role: "Original concept / Creative direction",
    scope: "WebGL / Content architecture / Responsive web",
    status: "AI-assisted build / Experience unvalidated",
    intro: "A forest portal, a world index and bilingual reading paths turn an original atmospheric direction into a navigable web experience.",
    introCn: "原创方向由我提出，并借助 AI 完成实现；内容包含 WebGL 森林入口、作品索引、双语内容与移动端重排。",
    cover: image("reverie-cover.jpg", "REVERIE 沉浸式网页体验封面", "Portal", "Original direction / AI-assisted build"),
    chapters: [
      {
        title: "ONE SCENE. ONE READING TASK.",
        titleCn: "一个场景，一种阅读任务。",
        body: "Each environment carries a distinct reading mood. Warm light, fog and constrained navigation build continuity without turning every world into the same card component.",
        images: [
          image("reverie-case/immersions.jpg", "雾林与暖灯构成的 REVERIE 场景", "Immersions", "Atmosphere / Entry"),
          image("reverie-case/forest.jpg", "森林中的暖灯入口", "Forest portal", "WebGL scene"),
          image("reverie-case/codex.jpg", "烛光地图与档案手稿场景", "Codex", "Reading world"),
          image("reverie-case/atelier.jpg", "暖光中的铜器工坊", "Atelier", "Object world"),
        ],
      },
      {
        title: "A WORLD STILL NEEDS AN INDEX.",
        titleCn: "世界不是卡片，但需要一套索引。",
        body: "The archive turns atmospheric scenes into a usable system: titles, categories and responsive order help visitors understand where they are and what can be opened next.",
        images: [
          image("reverie-case/card-hollow.jpg", "空之合唱森林场景", "Hollow choir", "World index"),
          image("reverie-case/card-tide.jpg", "潮汐图谱洞穴场景", "Tide atlas", "World index"),
          image("reverie-worlds.jpg", "REVERIE Worlds 桌面端完整界面", "Desktop archive", "Content architecture"),
          image("reverie-mobile.jpg", "REVERIE 移动端完整界面", "Mobile portal", "Responsive order", "portrait"),
        ],
      },
    ],
    closing: "The creative direction is live as a working case study. Usability, audience response and long-session performance still need real user validation.",
    closingCn: "创意已上线，体验仍待验证；页面如实标注原创方向与 AI 辅助实现。",
  },
  {
    slug: "melonpop",
    title: "MELO DEW",
    titleCn: "瓜露",
    discipline: "Beverage brand identity",
    year: "2026",
    role: "Brand / Visual direction",
    scope: "Identity / Packaging / Retail / Digital",
    status: "Personal concept",
    intro: "A watermelon slice and a single drop become a compact identity that moves from logo and packaging to commerce, retail and campaign touchpoints.",
    introCn: "以西瓜切片与水滴构成核心标志，再用西瓜红、果皮绿与奶油白延展到包装、数字端、门店和传播应用。",
    cover: image("melonpop/melo-dew-brand-overview.png", "MELO DEW 瓜露品牌总览与西瓜汁包装应用", "Brand overview", "Personal concept / AI-assisted visualisation", "board"),
    chapters: [
      {
        title: "A SLICE BECOMES A SYSTEM.",
        titleCn: "从一片西瓜，建立完整识别系统。",
        body: "The stacked and horizontal lockups, symbol rules, colour palette and bilingual typography turn the slice-and-drop idea into a repeatable identity system.",
        images: [
          image("melonpop/melo-dew-logo-system.png", "MELO DEW 瓜露标志组合、反白版本与使用规范", "Logo system", "Lockups / Symbol / Usage", "board"),
          image("melonpop/melo-dew-color-type.png", "MELO DEW 瓜露色彩、字体层级与图形母题", "Colour & typography", "Palette / Type / Motifs", "board"),
        ],
      },
      {
        title: "THE IDENTITY ENTERS DAILY USE.",
        titleCn: "让识别进入包装、纸品与数字端。",
        body: "Bottle, can, carton, takeaway and stationery applications test how the system holds across materials and information density. The digital boards extend the same hierarchy into commerce and mobile views.",
        images: [
          image("melonpop/melo-dew-packaging.png", "MELO DEW 瓜露瓶、罐、纸盒与外带杯包装系统", "Packaging system", "AI-assisted application visualisation", "board"),
          image("melonpop/melo-dew-stationery.png", "MELO DEW 瓜露信纸、名片、贴纸、吊牌与手提袋应用", "Stationery & applications", "AI-assisted application visualisation", "board"),
          image("melonpop/melo-dew-digital.png", "MELO DEW 瓜露桌面电商、移动购物与邮件视觉", "Digital commerce", "AI-assisted application visualisation", "board"),
        ],
      },
      {
        title: "FROM SHELF TO CAMPAIGN.",
        titleCn: "从零售空间继续走向传播画面。",
        body: "Retail, point-of-sale and social campaign boards test visibility at environmental and editorial scale. These remain AI-assisted visualisations for an independent concept, not evidence of an operating store or launched product.",
        images: [
          image("melonpop/melo-dew-retail.png", "MELO DEW 瓜露零售亭、菜单、冷柜与外带系统", "Retail & point of sale", "AI-assisted application visualisation", "board"),
          image("melonpop/melo-dew-campaign.png", "MELO DEW 瓜露社交传播与果汁产品视觉板", "Campaign direction", "AI-assisted application visualisation", "board"),
        ],
      },
    ],
    closing: "The identity and application language are resolved as a personal concept. Food labelling, packaging engineering, store operations and product flows remain untested.",
    closingCn: "品牌识别与应用语言已经形成；图中应用为 AI 辅助概念可视化，无真实客户、门店运营或产品上线。",
  },
  {
    slug: "vitrolume",
    title: "VITROLUME",
    titleCn: "珀光",
    discipline: "Premium glassware identity",
    year: "2025-2026",
    role: "Brand / Visual direction",
    scope: "Identity / Glassware / Packaging",
    status: "Personal concept",
    intro: "Transparency, refraction and controlled negative space connect an identity system to glass forms, packaging and display.",
    introCn: "以玻璃的透明、折射和留白建立品牌识别，再把同一套切面与光线语言延展到饮具造型、双杯礼盒和使用场景。",
    cover: image("vitrolume/glass-hero.png", "VitroLume 高端玻璃杯品牌主视觉", "Glassware study", "Personal concept"),
    chapters: [
      {
        title: "LIGHT IS THE IDENTITY.",
        titleCn: "让光穿过杯体，品牌才真正出现。",
        body: "Black and white contrast creates the stage; refracted lines and a restrained amber reflection become the recurring brand signal.",
        images: [
          image("vitrolume-posters.jpg", "VitroLume 品牌字标与折射海报系统", "Poster system", "Identity / Refraction"),
          image("vitrolume-applications.jpg", "VitroLume 手提袋应用研究", "Early application", "Graphic extension"),
        ],
      },
      {
        title: "FORM, GIFT, DISPLAY.",
        titleCn: "同一套语言，落到杯型、礼盒与陈列。",
        body: "Three glass forms and a double-glass gift set test consistency beyond graphics. The images are AI-assisted concept visualisations, not production photography.",
        images: [
          image("vitrolume/gift-set.png", "VitroLume 双杯硬质礼盒概念", "Double-glass gift set", "AI-assisted visualisation"),
          image("vitrolume/product-family.png", "VitroLume 三种玻璃饮具家族", "Glassware family", "Tumbler / Highball / Goblet"),
          image("vitrolume/lifestyle.png", "VitroLume 暮色吧台使用场景", "Drinking scene", "AI-assisted visualisation"),
          image("vitrolume/retail-display.png", "VitroLume 精品店陈列概念", "Retail display", "AI-assisted visualisation"),
        ],
      },
    ],
    closing: "The visual direction is coherent; rim thickness, grip, mould structure and packaging protection require physical prototyping.",
    closingCn: "品牌方向已经成立，下一步仍是实物打样与工程验证。",
  },
];

export function getSynthesisProject(slug: string) {
  return synthesisProjects.find((project) => project.slug === slug);
}
