export const getAnalyticsData = (req, res) => {
  res.json({
    success: true,
    message: "Analytics data fetched successfully",
    data: {
      userGrowth: [10, 25, 40, 55, 80],
      conversionRate: "67%",
      totalRevenue: 12800,
      topPerformers: ["John", "Sara", "Ravi"],
    },
  });
};
