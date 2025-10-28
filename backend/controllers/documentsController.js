export const getDocuments = (req, res) => {
  res.json({
    success: true,
    message: "Documents fetched successfully",
    documents: [
      { id: 1, name: "Invoice_March.pdf", type: "PDF", uploadedBy: "Admin" },
      { id: 2, name: "Travel_Policy.docx", type: "Word", uploadedBy: "HR" },
      { id: 3, name: "Expense_Report.xlsx", type: "Excel", uploadedBy: "Finance" },
    ],
  });
};
