export const getPolicies = (req, res) => {
  res.json({
    success: true,
    message: "Policies fetched successfully",
    policies: [
      { id: 1, title: "Travel Policy", name: "Travel Policy", status: "Active", category: "travel" },
      { id: 2, title: "Leave Policy", name: "Leave Policy", status: "Active", category: "hr" },
      { id: 3, title: "Expense Policy", name: "Expense Policy", status: "Draft", category: "finance" },
    ],
  });
};
