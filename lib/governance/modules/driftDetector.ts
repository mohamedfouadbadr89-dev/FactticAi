export const DriftDetector = {
    detect(riskScore: number, historyScores: number[]) {
        // Pure function
        if (historyScores.length === 0) return { drift_detected: false, score: 0 };
        const avg = historyScores.reduce((a,b)=>a+b, 0) / historyScores.length;
        const driftScore = riskScore - avg;
        return {
            drift_detected: driftScore > 20,
            drift_score: driftScore
        };
    }
};
