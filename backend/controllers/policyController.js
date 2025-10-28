export const getPolicies = (req, res) => {
  res.json({
    success: true,
    message: "Policies fetched successfully",
    policies: [
      { id: 1, name: "Travel Policy", status: "Active" },
      { id: 2, name: "Leave Policy", status: "Active" },
      { id: 3, name: "Expense Policy", status: "Draft" },
    ],
  });
};
