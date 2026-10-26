// =============================================================================
// entities.ts — Card & Trait data extracted from prototype
// =============================================================================

export type CardType = 'Character' | 'Event';
export type FieldName = 'Presentations' | 'Assignments' | 'Exams';
export type DeployEffect = 'drawCard' | 'boostField' | 'removeSynergyCard';

export interface Credits {
  Presentations: number;
  Assignments: number;
  Exams: number;
}

export interface Synergy {
  type: string;
  partnerId: string;
}

export interface CardDefinition {
  id: string;
  name: string;
  nameZh: string;
  type: CardType;
  credits: Credits;
  description: string;
  descriptionZh: string;
  deployEffect: DeployEffect | null;
  effectValue: number | null;
  synergy: Synergy | null;
  stayOnField?: boolean;
}

export interface TraitDefinition {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  passiveField?: FieldName;
  passiveValue?: number;
  passiveEffect?: string;
  activeAbility?: string;
  limitPerRound?: number;
  chance?: number;
  value?: number;
}

export interface TraitLibrary {
  background: TraitDefinition[];
  physiological: TraitDefinition[];
  psychological: TraitDefinition[];
}

// ---- Card Library ----

export const cardLibrary: CardDefinition[] = [
  {
    id: 'nerd1',
    name: 'Anime Nerd',
    nameZh: '动漫宅',
    type: 'Character',
    credits: { Presentations: 2, Assignments: 5, Exams: 5 },
    description: '5k followers on Github, 5 on LinkedIn.',
    descriptionZh: 'GitHub 5k 粉丝，LinkedIn 5 个。',
    deployEffect: null,
    effectValue: null,
    synergy: null,
  },
  {
    id: 'gymbro1',
    name: 'Gym Bro',
    nameZh: '健身达人',
    type: 'Character',
    credits: { Presentations: 6, Assignments: 3, Exams: 2 },
    description: '"You hitting chest today?"',
    descriptionZh: '"今天练胸吗？"',
    deployEffect: null,
    effectValue: null,
    synergy: null,
  },
  {
    id: 'richkid1',
    name: "Rich Int'l Kid",
    nameZh: '富二代留学生',
    type: 'Character',
    credits: { Presentations: 4, Assignments: 4, Exams: 1 },
    description: '"Can I pay to pass this course?"',
    descriptionZh: '"能花钱过这门课吗？"',
    deployEffect: null,
    effectValue: null,
    synergy: { type: 'Essay Ghostwriting', partnerId: 'richkid1' },
  },
  {
    id: 'prof1',
    name: 'Procrastinating Prof',
    nameZh: '拖延症教授',
    type: 'Character',
    credits: { Presentations: 3, Assignments: 6, Exams: 6 },
    description: '"Grades will be out next week, definitely."',
    descriptionZh: '"成绩下周一定出。"',
    deployEffect: null,
    effectValue: null,
    synergy: null,
  },
  {
    id: 'studious1',
    name: 'Overachiever',
    nameZh: '学霸',
    type: 'Character',
    credits: { Presentations: 4, Assignments: 7, Exams: 7 },
    description: '"The library is my second home."',
    descriptionZh: '"图书馆是我的第二个家。"',
    deployEffect: 'drawCard',
    effectValue: 1,
    synergy: null,
  },
  {
    id: 'dropout1',
    name: 'Dropout Entrepreneur',
    nameZh: '辍学创业者',
    type: 'Character',
    credits: { Presentations: 8, Assignments: 1, Exams: 1 },
    description: '"Degrees are overrated!"',
    descriptionZh: '"学位被高估了！"',
    deployEffect: null,
    effectValue: null,
    synergy: null,
    stayOnField: true,
  },
  {
    id: 'event_conflict',
    name: 'Group Work Conflict',
    nameZh: '小组冲突',
    type: 'Event',
    credits: { Presentations: 0, Assignments: 0, Exams: 0 },
    description: "Choose an opponent's field, randomly remove a card with Synergy.",
    descriptionZh: '选择对手一个区域，随机移除一张有协同效应的卡牌。',
    deployEffect: 'removeSynergyCard',
    effectValue: null,
    synergy: null,
  },
  {
    id: 'event_allnighter',
    name: 'All-Nighter',
    nameZh: '通宵达旦',
    type: 'Event',
    credits: { Presentations: 0, Assignments: 0, Exams: 0 },
    description: 'Choose one of your fields, all cards gain +1 credit.',
    descriptionZh: '选择你一个区域，所有卡牌获得 +1 学分。',
    deployEffect: 'boostField',
    effectValue: 1,
    synergy: null,
  },
];

// ---- Trait Library ----

export const traitLibrary: TraitLibrary = {
  background: [
    {
      id: 'trait_intl',
      name: 'International',
      nameZh: '国际生',
      description: '+1 Credit in Assignments (Passive)',
      descriptionZh: '作业区域 +1 学分（被动）',
      passiveField: 'Assignments',
      passiveValue: 1,
    },
    {
      id: 'trait_local',
      name: 'Domestic',
      nameZh: '本地生',
      description: 'Draw 1 card at turn start (Passive)',
      descriptionZh: '回合开始时抽 1 张牌（被动）',
      passiveEffect: 'drawOnTurnStart',
    },
    {
      id: 'trait_minority',
      name: 'Minority',
      nameZh: '少数族裔',
      description: '+2 total score at end of round if losing.',
      descriptionZh: '回合结束时如果落后则总分 +2。',
      passiveEffect: 'comebackBonus',
      value: 2,
    },
  ],
  physiological: [
    {
      id: 'trait_gym',
      name: 'Gym Buff',
      nameZh: '健身达人',
      description: '+1 Credit in Presentations (Passive)',
      descriptionZh: '演讲区域 +1 学分（被动）',
      passiveField: 'Presentations',
      passiveValue: 1,
    },
    {
      id: 'trait_skinny',
      name: 'Skinny Nerd',
      nameZh: '瘦弱书呆子',
      description: '+1 Credit in Exams (Passive)',
      descriptionZh: '考试区域 +1 学分（被动）',
      passiveField: 'Exams',
      passiveValue: 1,
    },
    {
      id: 'trait_impaired',
      name: 'Physically Impaired',
      nameZh: '身体残障',
      description: 'Opponent plays first.',
      descriptionZh: '对手先手。',
      passiveEffect: 'opponentStarts',
    },
  ],
  psychological: [
    {
      id: 'trait_adhd',
      name: 'ADHD',
      nameZh: '多动症',
      description: 'Discard 1 card, draw 2 (Active, 1/round)',
      descriptionZh: '弃 1 张牌，抽 2 张（主动，每回合 1 次）',
      activeAbility: 'adhdDraw',
      limitPerRound: 1,
    },
    {
      id: 'trait_calm',
      name: 'Calm Mind',
      nameZh: '冷静头脑',
      description: 'Negate opponent Event card effect (Passive, 50% chance)',
      descriptionZh: '50% 概率抵消对手事件卡效果（被动）',
      passiveEffect: 'negateEvent',
      chance: 0.5,
    },
    {
      id: 'trait_depressed',
      name: 'Depression',
      nameZh: '抑郁症',
      description: 'All your cards have -1 credit in Presentations.',
      descriptionZh: '所有卡牌在演讲区域 -1 学分。',
      passiveField: 'Presentations',
      passiveValue: -1,
    },
  ],
};
