// memory.js

const MEMORY_KEY = "alyndrik_long_term_memory";

const AlyndrikMemory = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(MEMORY_KEY)) || [];
    } catch {
      return [];
    }
  },

  save(memories) {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  },

  remember(text, type = "general") {
    const memories = this.load();

    // avoid duplicates
    if (memories.some(m => m.text === text)) return;

    memories.push({
      text,
      type,
      time: new Date().toISOString()
    });

    this.save(memories);
  },

  all() {
    return this.load();
  },

  summary(limit = 15) {
    return this.load()
      .slice(-limit)
      .map(m => `• ${m.text}`)
      .join("\n");
  }
};

export default AlyndrikMemory;