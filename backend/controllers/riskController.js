export const getRisks = (req, res) => {
  res.json({
    success: true,
    message: "Risk data fetched successfully",
    risks: [
      { id: 1, type: "Financial", level: "High", description: "Delayed vendor payment" },
      { id: 2, type: "Operational", level: "Medium", description: "Server downtime risk" },
      { id: 3, type: "Compliance", level: "Low", description: "Policy update pending" },
    ],
  });
};
