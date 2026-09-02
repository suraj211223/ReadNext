# CIA Triad — Exam Notes (10 Marks)

## 1) Introduction

The **CIA Triad** is the core model of information security. It defines the three primary goals that every secure system should satisfy:

1. **Confidentiality**
2. **Integrity**
3. **Availability**

A strong security design balances all three.

---

## 2) Confidentiality

### Definition

**Confidentiality** means protecting data from unauthorized access or disclosure.

Only authorized users/systems should view sensitive information.

### How it is achieved

- Encryption (data at rest and in transit)
- Access control (RBAC/ABAC)
- Authentication (passwords, MFA, certificates)
- Data classification and least privilege
- Secure network controls (VPN, TLS)

### Example

A student portal should not allow one student to view another student’s marks.

### If confidentiality fails

- Data leakage
- Privacy breach
- Financial/legal loss

---

## 3) Integrity

### Definition

**Integrity** means data remains accurate, complete, and unaltered except by authorized actions.

### How it is achieved

- Hash functions (e.g., SHA family)
- Message Authentication Codes (MAC)
- Digital signatures
- Checksums and file integrity monitoring
- Database constraints and transaction controls

### Example

If a banking transaction is created as `₹10,000`, it must not be changed to `₹50,000` during transfer/storage.

### If integrity fails

- Unauthorized modification
- Corrupted records
- Wrong business decisions

---

## 4) Availability

### Definition

**Availability** means authorized users can access systems/data when needed.

### How it is achieved

- Redundancy (multiple servers/links)
- Backups and disaster recovery
- Fault tolerance and clustering
- Capacity planning and monitoring
- Protection against DoS/DDoS

### Example

Online banking should remain accessible even if one data-center service fails.

### If availability fails

- Service downtime
- Productivity loss
- Revenue and trust impact

---

## 5) CIA Triad Diagram

```text
                 INFORMATION SECURITY
                         |
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
 Confidentiality      Integrity        Availability
        ↓                ↓                ↓
  Prevent unauthorized  Prevent         Ensure timely
       disclosure      unauthorized      access for
                       modification      authorized users
```

---

## 6) Comparison Table

| Security Goal     | Main Objective                          | Typical Controls                         | Threat if Broken                |
|-------------------|------------------------------------------|------------------------------------------|----------------------------------|
| Confidentiality   | Prevent unauthorized disclosure          | Encryption, ACL, authentication, MFA     | Data leak / privacy breach       |
| Integrity         | Prevent unauthorized alteration          | Hash, MAC, signatures, validation checks | Tampering / corrupted data       |
| Availability      | Ensure reliable and timely access        | Redundancy, backups, DR, anti-DDoS       | Outage / denial of service       |

---

## 7) Real-World Mapping (Quick)

- **Confidentiality:** HTTPS/TLS encryption for web sessions.
- **Integrity:** Signed software updates and message digests.
- **Availability:** Load balancing + failover servers.

---

## 8) Importance in Exam Language

The CIA Triad is called the **foundation of security architecture** because:

1. It gives clear security objectives.
2. It helps identify threats and suitable controls.
3. It guides policy, risk management, and security design.

---

## 9) Conclusion

A system is considered truly secure only when it protects:

- **Confidentiality** (no unauthorized reading),
- **Integrity** (no unauthorized change), and
- **Availability** (authorized access when needed).

Hence, the CIA Triad is the fundamental model for designing and evaluating secure information systems.
