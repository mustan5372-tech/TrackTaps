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
      // Sanitize all numeric values upfront
      const attended = Number(podSub.attended) || 0;
      const total = Number(podSub.total) || 0;
      const missed = Number(podSub.missed) || 0;
      const avgAtt = Number(podSub.avgAttendance) || (total > 0 ? Math.round((attended / total) * 100) : 0);

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
          // Standard fields for the rest of the app
          present: attended,
          total: total,
          attendance: avgAtt,
          // Store Pod.ai values as baseline for continuation
          initialPresent: attended,
          initialTotal: total,
          initialMissed: missed,
          // Store last sync info to prevent double-counting deltas
          lastSyncDate: new Date().toISOString().split('T')[0],
          podaiPercentage: avgAtt
        };
      } else {
        // Add new subject
        merged.push({
          id: `subject_pod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: podSub.title,
          podaiToken: podSub.token,
          podaiSynced: true,
          // Standard fields
          present: attended,
          total: total,
          attendance: avgAtt,
          // Baseline fields for continuation tracking
          initialPresent: attended,
          initialTotal: total,
          initialMissed: missed,
          podaiPercentage: avgAtt,
          lastSyncDate: new Date().toISOString().split('T')[0],
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
