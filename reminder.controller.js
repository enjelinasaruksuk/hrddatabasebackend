import db from "../config/db.config.js";

// GET employees dengan kontrak akan habis (urgent: ≤7 hari, attention: 8-30 hari)
export const getContractReminders = (req, res) => {
  const query = `
    SELECT 
      e.NIK,
      e.name,
      e.position,
      c.date_end,
      DATEDIFF(c.date_end, CURDATE()) AS days_left,
      'contract' AS reminder_type
    FROM employees e
    INNER JOIN contracts c ON e.NIK = c.NIK
    WHERE c.date_end IS NOT NULL 
      AND DATEDIFF(c.date_end, CURDATE()) BETWEEN 0 AND 30
      AND c.contract_status = 'Active'
    ORDER BY days_left ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const urgent = results.filter(r => r.days_left <= 7);
    const attention = results.filter(r => r.days_left > 7 && r.days_left <= 30);

    res.json({ urgent, attention });
  });
};

// GET training/certificate akan expired (urgent: ≤7 hari, attention: 8-30 hari)
export const getCertificateReminders = (req, res) => {
  const query = `
    SELECT 
      e.NIK,
      e.name,
      t.detail AS certificate_name,
      t.expiry_date,
      DATEDIFF(t.expiry_date, CURDATE()) AS days_left,
      'certificate' AS reminder_type
    FROM employees e
    INNER JOIN training t ON e.NIK = t.NIK
    WHERE t.expiry_date IS NOT NULL 
      AND DATEDIFF(t.expiry_date, CURDATE()) BETWEEN 0 AND 30
    ORDER BY days_left ASC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const urgent = results.filter(r => r.days_left <= 7);
    const attention = results.filter(r => r.days_left > 7 && r.days_left <= 30);

    res.json({ urgent, attention });
  });
};

// GET ALL reminders (contract + certificate)
export const getAllReminders = (req, res) => {
  const queryContracts = `
    SELECT 
      e.NIK,
      e.name,
      e.position,
      c.date_end AS expiry_date,
      DATEDIFF(c.date_end, CURDATE()) AS days_left,
      'contract' AS reminder_type,
      NULL AS certificate_name
    FROM employees e
    INNER JOIN contracts c ON e.NIK = c.NIK
    WHERE c.date_end IS NOT NULL 
      AND DATEDIFF(c.date_end, CURDATE()) BETWEEN 0 AND 30
      AND c.contract_status = 'Active'
  `;

  const queryCertificates = `
    SELECT 
      e.NIK,
      e.name,
      e.position,
      t.expiry_date,
      DATEDIFF(t.expiry_date, CURDATE()) AS days_left,
      'certificate' AS reminder_type,
      t.detail AS certificate_name
    FROM employees e
    INNER JOIN training t ON e.NIK = t.NIK
    WHERE t.expiry_date IS NOT NULL 
      AND DATEDIFF(t.expiry_date, CURDATE()) BETWEEN 0 AND 30
  `;

  const finalQuery = `
    (${queryContracts})
    UNION ALL
    (${queryCertificates})
    ORDER BY days_left ASC
  `;

  db.query(finalQuery, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const urgent = results.filter(r => r.days_left <= 7);
    const attention = results.filter(r => r.days_left > 7 && r.days_left <= 30);

    res.json({ 
      urgent, 
      attention,
      total: results.length 
    });
  });
};