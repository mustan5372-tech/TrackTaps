/**
 * Service for Pod.ai data processing and syncing
 */
class PodAiService {
  /**
   * Merges fetched Pod.ai subjects with existing subjects in the store
   * @param {Array} existingSubjects - Current subjects in the store
   * @param {Array} podaiSubjects - Subjects fetched from Pod.ai
   * @returns {Array} - Merged subjects array
   */
  static mergeSubjects(existingSubjects, podaiSubjects) {
    const merged = [...existingSubjects];
    
    podaiSubjects.forEach(podSub => {
      // Find if this subject already exists (by name or podaiToken)
      const existingIdx = merged.findIndex(s => 
        s.podaiToken === podSub.token || 
        s.name.toLowerCase() === podSub.title.toLowerCase()
      );
      
      if (existingIdx >= 0) {
        // Update existing subject
        merged[existingIdx] = {
          ...merged[existingIdx],
          podaiToken: podSub.token,
          podaiSynced: true,
          // Update attendance data if available
          present: podSub.attended !== undefined ? podSub.attended : merged[existingIdx].present,
          total: podSub.total !== undefined ? podSub.total : merged[existingIdx].total,
          attendance: podSub.averagePercent !== undefined ? podSub.averagePercent : merged[existingIdx].attendance
        };
      } else {
        // Add new subject
        merged.push({
          id: `subject_pod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: podSub.title,
          podaiToken: podSub.token,
          podaiSynced: true,
          present: podSub.attended || 0,
          total: podSub.total || 0,
          attendance: podSub.averagePercent || 0,
          criteria: 75,
          color: this.getRandomColor(),
          createdAt: new Date().toISOString()
        });
      }
    });
    
    return merged;
  }

  static getRandomColor() {
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default PodAiService;
