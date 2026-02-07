// memory.js

const MEMORY_KEY = "alyndrik_long_term_memory";

const AlyndrikMemory = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(MEMORY_KEY)) || [];
    } catch (e) {
      console.warn("⚠️ Failed to load memory:", e);
      return [];
    }
  },

  save(memories) {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  },

  remember(text, type = "general") {
    if (!text) return;

    const memories = this.load();

    // Avoid duplicates
    if (memories.some(m => m.text === text)) return;

    memories.push({
      text,
      type,
      time: new Date().toISOString()
    });

    this.save(memories);
  },

  getAll() {
    return this.load();
  },

  summary(limit = 15) {
    return this.load()
      .slice(-limit)
      .map(m => `• ${m.text}`)
      .join("\n");
  },

  clear() {
    localStorage.removeItem(MEMORY_KEY);
  }
};

export default AlyndrikMemory;