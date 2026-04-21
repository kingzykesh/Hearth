def predict_combined(stress_result, depression_result, rule_result):
    labels = []

    if stress_result:
        labels.append(stress_result["label"])

    if depression_result:
        labels.append(depression_result["label"])

    combined_summary = rule_result["summary"]

    if labels:
        combined_summary += " Model signals: " + " | ".join(labels)

    return {
        "stress_result": stress_result,
        "depression_result": depression_result,
        "combined_summary": combined_summary,
    }