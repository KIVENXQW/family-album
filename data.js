// 草稿用的示例数据。真实版本里这些会从数据库读。
window.ALBUM = {
  people: [
    { id: 'nainai', name: '奶奶', years: '1938 —', family: true, portrait: 'n03' },
    { id: 'yeye', name: '爷爷', years: '1935 —', family: true, portrait: 'n08' },
    { id: 'baba', name: '爸爸', years: '1965 —', family: true, portrait: 'n02' },
    { id: 'mama', name: '妈妈', years: '1968 —', family: true, portrait: 'n04' },
    { id: 'xiaoman', name: '小满', years: '2016 —', family: true, portrait: 'n05' }
  ],
  photos: [
    { id: 'n01', src: 'thumbs/01-chunjie-1990.jpg', full: 'photos/01-chunjie-1990.jpg', year: 1990, people: ['nainai', 'yeye', 'baba'], note: '年夜饭。桌上那盘鱼是爷爷做的。' },
    { id: 'n02', src: 'thumbs/02-quanjiafu-2023.jpg', full: 'photos/02-quanjiafu-2023.jpg', year: 2023, people: ['nainai', 'yeye', 'baba', 'mama', 'xiaoman'], note: '拍完才发现后面还有人站着看。' },
    { id: 'n03', src: 'thumbs/03-nainai-sunnv.jpg', full: 'photos/03-nainai-sunnv.jpg', year: 2026, people: ['nainai', 'xiaoman'], note: '小满在树底下写作业，奶奶在旁边坐了一下午。' },
    { id: 'n04', src: 'thumbs/04-haibian.jpg', full: 'photos/04-haibian.jpg', year: 2022, people: ['baba', 'mama'], note: '风大得说话都听不见。' },
    { id: 'n05', src: 'thumbs/05-shengri-lazhu.jpg', full: 'photos/05-shengri-lazhu.jpg', year: 2025, people: ['xiaoman'], note: '蜡烛插歪了也不管。' },
    { id: 'n06', src: 'thumbs/06-laozhaopian-1980.jpg', full: 'photos/06-laozhaopian-1980.jpg', year: 1980, people: ['nainai'], note: '奶奶二十三岁。背景是画上去的布景。' },
    { id: 'n07', src: 'thumbs/07-jingqu.jpg', full: 'photos/07-jingqu.jpg', year: 2022, people: ['baba', 'mama', 'xiaoman'], note: '景区门口，请人帮我们拍的。' },
    { id: 'n08', src: 'thumbs/08-jiaozi.jpg', full: 'photos/08-jiaozi.jpg', year: 2024, people: ['yeye'], note: '爷爷坚持自己擀皮，说机器压的不香。' },
    { id: 'n10', src: 'thumbs/10-chuangshang.jpg', full: 'photos/10-chuangshang.jpg', year: 2026, people: ['xiaoman'], note: '周末下午，床上翻得不成样子。' },
    { id: 'n11', src: 'thumbs/11-cunkou.jpg', full: 'photos/11-cunkou.jpg', year: 2023, people: ['nainai', 'yeye', 'baba', 'mama', 'xiaoman'], note: '回老家那天在村口拍的。' },
    { id: 'n12', src: 'thumbs/12-yuanzi-1996.jpg', full: 'photos/12-yuanzi-1996.jpg', year: 1996, people: ['nainai', 'yeye'], note: '葡萄架刚搭起来那年。' }
  ]
};
