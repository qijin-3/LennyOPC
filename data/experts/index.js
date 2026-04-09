'use strict';
// Aggregates all expert files into EXPERTS array and FALLBACK_RESPONSES map.
// Load order: each expert_*.js must be loaded before this file.

const EXPERTS = [
  EXPERT_LENNY_RACHITSKY,
  EXPERT_JASON_FRIED,
  EXPERT_APRIL_DUNFORD,
  EXPERT_PATRICK_CAMPBELL,
  EXPERT_SHREYAS_DOSHI,
  EXPERT_ELENA_VERNA,
  EXPERT_RYAN_HOOVER,
  EXPERT_JULIE_ZHUO,
  EXPERT_ANDREW_WILKINSON,
  EXPERT_BRIAN_BALFOUR,
];

// Build FALLBACK_RESPONSES from each expert's fallbackReplies field
const FALLBACK_RESPONSES = {};
EXPERTS.forEach(e => { FALLBACK_RESPONSES[e.id] = e.fallbackReplies || []; });
FALLBACK_RESPONSES.default = [
  "这是个好问题。我觉得最重要的是先把基础搞清楚——你的核心客户是谁，他们真正的痛点是什么？",
  "从我的经验来看，早期创业最重要的是速度——快速假设、快速验证、快速调整。你现在的迭代速度怎么样？",
  "我认识一些做过类似事情的人。你有没有考虑过直接联系几个潜在客户做深度访谈？",
  "说实话，你描述的问题很多创始人都会遇到。关键是不要想太多，先迈出第一步。"
];
