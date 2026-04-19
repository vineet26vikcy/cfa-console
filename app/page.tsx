"use client";

import React, { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookOpen, Calendar, ChevronRight, ChevronDown, Info, CalendarDays, CheckCircle2, X, Download, Upload, PieChart, Target, ListTodo, Settings, AlertTriangle } from 'lucide-react';

// --- 1. DATA & WEIGHTAGE ---

const CFA_SYLLABUS_OFFICIAL: Record<string, { weight: string, sections: Record<string, string[]> }> = {
  "Ethics": { weight: "15-20%", sections: { "Official Modules": ["Module 89.1: Ethics and Trust", "Module 90.1: Code and Standards", "Module 91.1: Guidance for Standards I(A) and I(B)", "Module 91.2: Guidance for Standards I(C), I(D), and I(E)", "Module 91.3: Guidance for Standard II", "Module 91.4: Guidance for Standards III(A) and III(B)", "Module 91.5: Guidance for Standards III(C), III(D), and III(E)", "Module 91.6: Guidance for Standard IV", "Module 91.7: Guidance for Standard V", "Module 91.8: Guidance for Standard VI", "Module 91.9: Guidance for Standard VII", "Module 92.1: Introduction to GIPS", "Module 93.1: Ethics Application"] } },
  "Quants": { weight: "6-9%", sections: { "Official Modules": ["Module 1.1: Interest Rates and Return Measurement", "Module 1.2: Time-Weighted and Money-Weighted Returns", "Module 1.3: Common Measures of Return", "Module 2.1: Discounted Cash Flow Valuation", "Module 2.2: Implied Returns and Cash Flow Additivity", "Module 3.1: Central Tendency and Dispersion", "Module 3.2: Skewness, Kurtosis, and Correlation", "Module 4.1: Probability Models, Expected Values, and Bayes’ Formula", "Module 5.1: Probability Models for Portfolio Return and Risk", "Module 6.1: Lognormal Distributions and Simulation Techniques", "Module 7.1: Sampling Techniques and the Central Limit Theorem", "Module 8.1: Hypothesis Testing Basics", "Module 8.2: Types of Hypothesis Tests", "Module 9.1: Tests for Independence", "Module 10.1: Linear Regression Basics", "Module 10.2: Analysis of Variance (ANOVA) and Goodness of Fit", "Module 10.3: Predicted Values and Functional Forms of Regression", "Module 11.1: Introduction to Fintech"] } },
  "Economics": { weight: "6-9%", sections: { "Official Modules": ["Module 12.1: Breakeven, Shutdown, and Scale", "Module 12.2: Characteristics of Market Structures", "Module 12.3: Identifying Market Structures", "Module 13.1: Business Cycles", "Module 14.1: Fiscal Policy Objectives", "Module 14.2: Fiscal Policy Tools and Implementation", "Module 15.1: Central Bank Objectives and Tools", "Module 15.2: Monetary Policy Effects and Limitations", "Module 16.1: Geopolitics", "Module 17.1: International Trade", "Module 18.1: The Foreign Exchange Market", "Module 18.2: Managing Exchange Rates", "Module 19.1: Foreign Exchange Rates"] } },
  "FSA": { weight: "11-14%", sections: { "Official Modules": ["Module 27.1: Financial Statement Roles", "Module 28.1: Revenue Recognition", "Module 28.2: Expense Recognition", "Module 28.3: Nonrecurring Items", "Module 28.4: Earnings Per Share", "Module 28.5: Ratios and Common-Size Income Statements", "Module 29.1: Intangible Assets and Marketable Securities", "Module 29.2: Common-Size Balance Sheets", "Module 30.1: Cash Flow Introduction and Direct Method CFO", "Module 30.2: Indirect Method CFO", "Module 30.3: Investing and Financing Cash Flows and IFRS/U.S. GAAP Differences", "Module 31.1: Analyzing Statements of Cash Flows II", "Module 32.1: Inventory Measurement", "Module 32.2: Inflation Impact on FIFO and LIFO", "Module 32.3: Presentation and Disclosure", "Module 33.1: Intangible Long-Lived Assets", "Module 33.2: Impairment and Derecognition", "Module 33.3: Long-Term Asset Disclosures", "Module 34.1: Leases", "Module 34.2: Deferred Compensation and Disclosures", "Module 35.1: Differences Between Accounting Profit and Taxable Income", "Module 35.2: Deferred Tax Assets and Liabilities", "Module 35.3: Tax Rates and Disclosures", "Module 36.1: Reporting Quality", "Module 36.2: Accounting Choices and Estimates", "Module 36.3: Warning Signs", "Module 37.1: Introduction to Financial Ratios", "Module 37.2: Financial Ratios, Part 1", "Module 37.3: Financial Ratios, Part 2", "Module 37.4: DuPont Analysis", "Module 37.5: Industry-Specific Financial Ratios", "Module 38.1: Financial Statement Modeling"] } },
  "Corporate Issuers": { weight: "6-9%", sections: { "Official Modules": ["Module 20.1: Features of Corporate Issuers", "Module 21.1: Stakeholders and ESG Factors", "Module 22.1: Corporate Governance", "Module 23.1: Liquidity Measures and Management", "Module 24.1: Capital Investments and Project Measures", "Module 24.2: Capital Allocation Principles and Real Options", "Module 25.1: Weighted-Average Cost of Capital", "Module 25.2: Capital Structure Theories", "Module 26.1: Business Model Features and Types"] } },
  "Equity Investments": { weight: "11-14%", sections: { "Official Modules": ["Module 39.1: Markets, Assets, and Intermediaries", "Module 39.2: Positions and Leverage", "Module 39.3: Order Execution and Validity", "Module 40.1: Index Weighting Methods", "Module 40.2: Uses and Types of Indexes", "Module 41.1: Market Efficiency", "Module 42.1: Types of Equity Investments", "Module 42.2: Foreign Equities and Equity Risk", "Module 43.1: Company Research Reports", "Module 43.2: Revenue, Profitability, and Capital", "Module 44.1: Industry Analysis", "Module 44.2: Industry Structure and Competitive Positioning", "Module 45.1: Forecasting in Company Analysis", "Module 46.1: Dividends, Splits, and Repurchases", "Module 46.2: Dividend Discount Models", "Module 46.3: Relative Valuation Measures"] } },
  "Fixed Income": { weight: "11-14%", sections: { "Official Modules": ["Module 47.1: Fixed-Income Instrument Features", "Module 48.1: Fixed-Income Cash Flows and Types", "Module 49.1: Fixed-Income Issuance and Trading", "Module 50.1: Fixed-Income Markets for Corporate Issuers", "Module 51.1: Fixed-Income Markets for Government Issuers", "Module 52.1: Fixed-Income Bond Valuation: Prices and Yields", "Module 53.1: Yield and Yield Spread Measures for Fixed-Rate Bonds", "Module 54.1: Yield and Yield Spread Measures for Floating-Rate Instruments", "Module 55.1: The Term Structure of Interest Rates: Spot, Par, and Forward Curves", "Module 56.1: Interest Rate Risk and Return", "Module 57.1: Yield-Based Bond Duration Measures and Properties", "Module 58.1: Yield-Based Bond Convexity and Portfolio Properties", "Module 59.1: Curve-Based and Empirical Fixed-Income Risk Measures", "Module 60.1: Credit Risk", "Module 61.1: Credit Analysis for Government Issuers", "Module 62.1: Credit Analysis for Corporate Issuers", "Module 63.1: Fixed-Income Securitization", "Module 64.1: Asset-Backed Security (ABS) Instrument and Market Features", "Module 65.1: Mortgage-Backed Security (MBS) Instrument and Market Features"] } },
  "Derivatives": { weight: "5-8%", sections: { "Official Modules": ["Module 66.1: Derivatives Markets", "Module 67.1: Forwards and Futures", "Module 67.2: Swaps and Options", "Module 68.1: Uses, Benefits, and Risks of Derivatives", "Module 69.1: Arbitrage, Replication, and Carrying Costs", "Module 70.1: Forward Contract Valuation", "Module 71.1: Futures Valuation", "Module 72.1: Swap Valuation", "Module 73.1: Option Valuation", "Module 74.1: Put-Call Parity", "Module 75.1: Binomial Model for Option Values"] } },
  "Alternative Investments": { weight: "7-10%", sections: { "Official Modules": ["Module 76.1: Alternative Investment Structures", "Module 77.1: Performance Appraisal and Return Calculations", "Module 78.1: Private Capital", "Module 79.1: Real Estate", "Module 79.2: Infrastructure", "Module 80.1: Farmland, Timberland, and Commodities", "Module 81.1: Hedge Funds", "Module 82.1: Distributed Ledger Technology", "Module 82.2: Digital Asset Characteristics"] } },
  "Portfolio Management": { weight: "8-12%", sections: { "Official Modules": ["Module 83.1: Historical Risk and Return", "Module 83.2: Risk Aversion", "Module 83.3: Portfolio Standard Deviation", "Module 83.4: The Efficient Frontier", "Module 84.1: Systematic Risk and Beta", "Module 84.2: The CAPM and the SML", "Module 85.1: Portfolio Management Process", "Module 85.2: Asset Management and Pooled Investments", "Module 86.1: Portfolio Planning and Construction", "Module 87.1: Cognitive Errors vs. Emotional Biases", "Module 87.2: Emotional Biases", "Module 88.1: Introduction to Risk Management"] } },
};

const CFA_SYLLABUS_PARTH: Record<string, { weight: string, sections: Record<string, string[]> }> = {
  "Ethics": { weight: "15-20%", sections: {
    "10.1 - Ethics and Trust": ["10.1.1 - Ethics & Trust - 1 | 0:44:43", "10.1.2 - Ethics & Trust - 2 | 0:33:27", "10.1.3 - Ethics & Trust - 3 | 0:20:25", "10.1.4 - Ethics & Trust - 4 | 0:16:47", "10.1.5 - Ethics & Trust - 5 | 0:45:47", "10.1.6 - Ethics & Trust - 6 | 0:37:04", "10.1.7 - Ethics & Trust - 7 | 0:00:37"],
    "10.2 - Code and Standards": ["10.2.1 - Code & Standards - 1 | 0:23:05", "10.2.2 - Code & Standards - 2 | 0:22:09", "10.2.3 - Code & Standards - 3 | 0:33:46"],
    "10.3 - Standards": ["10.3.0 - Imp Ethics Discussion - 1 | 0:27:31", "10.3.1A - Standard 1A - Knowledge Of Law - 1 | 0:30:26", "10.3.1B - Standard 1B - Independence - 1 | 0:12:39", "10.3.1C - Standard 1B - Independence - 2 | 1:08:47", "10.3.1D - Standard 1B - Independence - 3 | 0:19:32", "10.3.1E - Standard 1B - Independence - 4 | 0:54:09", "10.3.1E - Standard 1E - Compentancy - 1 | 0:22:33", "10.3.1F - Standard 1 - MCQs | 2:00:19", "10.3.1F - Standard 1B - Independence - 5 | 0:22:01", "10.3.1G - Standard 1B - Independence - 6 | 0:16:13", "10.3.1G - Standard 1B - Independence - 7 | 0:46:16", "10.3.1H - Standard 1C - Misrepresentation - 1 | 0:10:31", "10.3.1I - Standard 1C - Misrepresentation - 2 | 0:38:55", "10.3.1J - Standard 1C - Misrepresentation - 3 | 0:46:39", "10.3.1K - Standard 1D - Misconduct - 1 | 1:11:39", "10.3.1L - Standard 1D - Misconduct - 2 | 0:27:36", "10.3.1M - Standard 1E - Compentancy - 2 | 0:15:56", "10.3.2 - Standard 2A - MNPI | 1:14:18", "10.3.2A - Standard 2A - MNPI - 2 | 0:09:58", "10.3.2B - Standard 2A - MNPI - 3 | 0:57:07", "10.3.2C - Standard 2A - MNPI - 4 | 1:03:37", "10.3.2D - Standard 2B - Market Manipulation - 1 | 0:32:43", "10.3.2E - Standard 2B - Market Manipulation - 2 | 0:42:45", "10.3.2F - Standard 2 - MCQs | 1:12:40", "10.3.3A - Standard 3A - Loyalty Prudence, Care - 1 | 0:46:56", "10.3.3B - Standard 3A - Loyalty Prudence, Care - 2 | 0:29:49", "10.3.3C - Standard 3A - Loyalty Prudence, Care - 3 | 0:09:24", "10.3.3D - Standard 3A - Loyalty Prudence, Care - 4 | 1:03:29", "10.3.3E - Standard 3A - Loyalty Prudence, Care - 5 | 0:14:34", "10.3.3F - Standard 3A - Loyalty Prudence, Care - 6 | 1:08:20", "10.3.3G - Standard 3B - Fair Dealing - 1 | 0:41:05", "10.3.3H - Standard 3B - Fair Dealing - 2 | 0:15:28", "10.3.3I - Standard 3B - Fair Dealing - 3 | 0:16:32", "10.3.3J - Standard 3B - Fair Dealing - 4 | 0:33:23", "10.3.3K - Standard 3C - Suitability - 1 | 0:47:56", "10.3.3L - Standard 3C - Suitability - 2 | 0:10:06", "10.3.3M - Standard 3C - Suitability - 3 | 0:22:21", "10.3.3N - Standard 3D - Performance Pres - 1 | 0:31:38", "10.3.3O - Standard 3D - Performance Pres - 2 | 0:21:40", "10.3.3P - Standard 3D - Performance Pres - 3 | 0:16:50", "10.3.3Q - Standard 3D - Performance Pres - 4 | 0:19:40", "10.3.4A - Standard 4A - Loyalty - 1 | 0:15:50", "10.3.4B - Standard 4A - Loyalty - 2 | 0:48:19", "10.3.4C - Standard 4A - Loyalty - 3 | 0:19:34", "10.3.4D - Standard 4A - Loyalty - 4 | 0:11:55", "10.3.4E - Standard 4A - Loyalty - 5 | 1:32:32", "10.3.4F - Standard 4B - Additional Comp - 1 | 0:18:46", "10.3.4G - Standard 4B - Additional Comp - 2 | 0:13:26", "10.3.4H - Standard 4C - Supervisor - 1 | 1:04:16", "10.3.4I - Standard 4C - Supervisor - 2 | 1:47:07", "10.3.4J - Standard 4C - Supervisor - 3 | 0:57:24", "10.3.5A - Standard 5A - Diligence, Care - 1 | 1:10:27", "10.3.5B - Standard 5A - Diligence, Care - 2 | 0:50:41", "10.3.5C - Standard 5A - Diligence, Care - 3 | 0:25:57", "10.3.5D - Standard 5A - Diligence, Care - 4 | 0:45:56", "10.3.5E - Standard 5B - Client Communication - 1 | 1:09:25", "10.3.5F - Standard 5B - Client Communication - 2 | 0:32:27", "10.3.5G - Standard 5B - Client Communication - 3 | 0:44:24", "10.3.5H - Standard 5C - Record Retention | 0:18:07", "10.3.6A - Standard 6A - Disclosure of Conflict - 1 | 1:13:25", "10.3.6B - Standard 6A - Disclosure of Conflict - 2 | 0:17:10", "10.3.6C - Standard 6B - Priority of Trans - 1 | 0:46:59", "10.3.6D - Standard 6B - Priority of Trans - 2 | 0:14:17", "10.3.6E - Standard 6B - Priority of Trans - 3 | 0:08:59", "10.3.6F - Standard 6C - Referral Fees | 0:29:34", "10.3.7A - Conduct in CFA program | 0:56:36", "10.3.7B - Reference to CFA designation - 1 | 0:47:41", "10.3.7C - Reference to CFA designation - 2 | 0:32:45", "10.3.8A - Revision Std 1 and 2 | 1:11:09", "10.3.8B - Revision Std 3 | 1:08:51"],
    "10.4 - GIPS": ["10.4A - Intro to GIPS - 1 | 0:50:04", "10.4B - Intro to GIPS - 2 | 0:33:52", "10.4C - Intro to GIPS - 3 | 0:39:15", "10.4D - Intro to GIPS - 4 | 0:12:05"]
  }},
  "Quants": { weight: "6-9%", sections: {
    "1.0 - Time Value of Money": ["1.0.1 - About Quants Risk Aversion | 0:20:21", "1.0.2 - Intro to TVM | 1:03:58", "1.0.3 - TVM-Diff Frequencies | 1:35:02", "1.0.4 - Quick Recap | 1:16:30", "1.0.5 - TVM-SAR and EAR | 0:24:06", "1.0.6 - TVM-Annuity, Perpetuity | 1:09:17", "1.0.7 - Uneven CFs and Practice Qs | 2:49:32", "1.0.8 - More Practice Qs | 2:08:04"],
    "1.1 - Rates and Returns": ["1.1.1 - Intro, HPR, AMGM | 1:19:39", "1.1.2 - HM, Trimmed mean | 1:12:18", "1.1.3 - Quick Recap | 0:20:03", "1.1.4 - TWR and MWR | 1:55:39", "1.1.5 - Annualized Returns and Others | 0:50:15", "1.1.6 - Leveraged Returns | 0:34:03", "1.1.7 - Practice Qs | 0:37:21"],
    "1.2 - TVM for Finance": ["1.2.1 - TVM for Finance | 0:06:19"],
    "1.3 - PreRequisites": ["1.3.0 - PR - Organising, Visualizing Data | 1:32:31", "1.3.1 - Central Tendency | 2:44:49", "1.3.2 - Dispersion | 2:42:44", "1.3.3 - Kurtosis, Covariance | 2:30:39"],
    "1.4 - Probability": ["1.4.1 - Probability Basics - 1 | 1:24:02", "1.4.2 - Probability Basics - 2 | 1:09:32", "1.4.3 - Probability Trees | 2:05:12"],
    "1.5 - Portfolio Mathematics": ["1.5.1 - Portfolio Mathematics | 3:03:37"],
    "1.6 - Probability Distributions": ["1.6.1 - Prob Distributions | 2:14:42", "1.6.2 - Normal Distribution, Z Table | 3:28:33", "1.6.2 - Confidence Interval | 1:43:07", "1.6.2 - Normal and Log Normal Distribution | 0:46:46"],
    "1.7 - Simulation Methods": ["1.7.1 - Simulation Methods - Intro | 0:52:34", "1.7.2 - Simulation in Excel | 0:42:27", "1.7.3 - Binomial Model | 1:01:31", "1.7.4 - Shape of Binomial Model | 0:30:51", "1.7.5 - Simulations MCQs | 1:27:20"],
    "1.8 - Estimation Inference": ["1.8.1 - Sampling and Central Limit Theorm | 2:01:08", "1.8.2 - Point Estimate, T Dist, & Ques | 2:46:15"],
    "1.9 - Hypothesis Testing": ["1.9.1 - Hypothesis Testing - 1 | 3:09:08", "1.9.2 - Hypothesis Testing - 2 | 1:33:04", "1.9.3 - Hypothesis Testing - 3 | 1:19:46", "1.9.4 - Hypothesis Testing - 4 | 1:19:18", "1.9.5 - Hypothesis Testing - 5 | 1:11:10"],
    "1.9B - Linear Regression": ["1.9A.1 - Linear Regression - 1 | 2:09:23", "1.9A.2 - Linear Regression - 2 | 2:31:40", "1.9A.3 - Linear Regression - 3 | 2:54:01", "1.9A.4 - Linear Regression - 4 | 1:14:33"],
    "1.9C - Intro to Big Data": ["1.9C.1 - Intro to Big Data -1 | 0:39:18", "1.9C.2 - Intro to Big Data -2 | 0:46:38"]
  }},
  "Economics": { weight: "6-9%", sections: {
    "5.0 - Micro Prerequisites": ["5.0.1 - Economics Prep Strategy | 0:36:04", "5.0.2 - Demand and Supply - 1 | 1:05:52", "5.0.3 - Demand and Supply - 2 | 0:37:36", "5.0.4 - Demand and Supply - 3 | 0:20:20", "5.0.5 - Demand and Supply - 4 | 0:23:42", "5.0.6 - Demand and Supply - 5 | 1:07:14", "5.0.7 - Demand and Supply - 6 | 0:21:23"],
    "5.1 - Firm Structure and Markets": ["5.1.1 - Firm Structure and Markets - 1 | 0:36:15", "5.1.2 - Firm Structure and Markets - 2 | 0:10:58", "5.1.3 - Firm Structure and Markets - 3 | 0:22:32", "5.1.4 - Firm Structure and Markets - 4 | 1:14:31", "5.1.5 - Firm Structure and Markets - 5 | 0:24:26"],
    "5.2 - Macro Prerequisites": ["5.2.1 - GDP | 0:54:22", "5.2.2 - National Income | 0:22:42", "5.2.3 - Aggregate Demand | 0:15:16", "5.2.4 - AD Curve | 0:47:14", "5.2.5 - Aggregate Supply | 0:31:45", "5.2.6 - Shift in Curve | 0:24:20"],
    "5.3 - Business Cycles": ["5.3.1 - Business Cycles | 0:39:01", "5.3.2 - Credit Cycles | 0:38:07"],
    "5.4 - Fiscal Policy": ["5.4.1 - Fiscal Policy - 1 | 0:26:39", "5.4.2 - Fiscal Policy - 2 | 0:34:40", "5.4.3 - Fiscal Policy Tools | 0:32:15", "5.4.4 - Fiscal Multiplier | 0:38:19", "5.4.5 - Fiscal Policy Implementation | 0:22:42"],
    "5.5 - Monetary Policy": ["5.5.1 - Intro to Monetary Policy | 0:58:34", "5.5.2 - Repo, Reserves and OMOS | 0:24:44", "5.5.3 - Interest Rates - 1 | 0:28:52", "5.5.4 - Interest Rates - 2 | 0:15:40", "5.5.5 - Interest Rate Targeting | 0:15:51", "5.5.5 - IR Targeting and Limitations | 0:53:08", "5.5.6 - Fiscal and Monetary | 0:08:32"],
    "5.6 - Intro to Geopolitics": ["5.6.1 - Geopolitics Intro | 0:27:55", "5.6.2 - Geopolitics Risks | 0:12:23", "5.6.3 - Globalisation | 0:14:47", "5.6.4 - IMF, WB, WTO | 0:37:24"],
    "5.7 - International Trade and FX": ["5.7.1 - Classic Trade Theory | 0:30:59", "5.7.2 - Tariff, Quota, Quota Rent | 0:28:54", "5.7.3 - International Trade and FX - 3 | 0:12:04"],
    "5.8 - Capital Flow and FX": ["5.8.1 - Mechanics of International Trade | 1:36:49", "5.8.2 - Real, Nominal Exchange Rate | 0:46:06", "5.8.3 - Forex | 0:21:30", "5.8.4 - Spot and Future Rates - 1 | 0:56:11", "5.8.5 - Spot and Future Rates - 2 | 0:27:05", "5.8.6 - Forward Points | 0:24:21", "5.8.7 - CFA Guidance | 0:18:14", "5.8.8 - Forward Rate Arbitrage | 1:01:08", "5.8.9 - Exchange Rate Regime - 1 | 1:44:31", "5.8.9a - Exchange Rate Regime - 2 | 0:02:59"]
  }},
  "FSA": { weight: "11-14%", sections: {
    "2.0 - Intro to FSA": ["2.0.1 - How to Study FSA + Intro | 1:47:00", "2.0.2 - Intro to FSA - 2 | 2:22:15"],
    "2.1 - Analyzing Income Statement": ["2.1.1 - Revenue | 2:03:15", "2.1.2 - Exp Recognition - 1 | 1:25:26", "2.1.3 - Capitalization of Exps | 1:31:08", "2.1.4 - R and D, Non Recurring Exp | 1:51:56", "2.1.5 - Basic & Diluted EPS | 1:23:11", "2.1.6 - EPS 2 | 1:22:30"],
    "2.2 - Analyzing Balance Sheet": ["2.2.1 - Intangible Assets | 0:42:54", "2.2.2 - Goodwill | 1:00:16", "2.2.3 - Financial Instruments - 1 | 1:04:34", "2.2.4 - Financial Instruments - 2 | 1:27:44", "2.2.5 - CFA Strategy Tips | 0:41:24"],
    "2.3 - Analyzing Cash Flow": ["2.3.1 - Cash Flows - Foundations | 1:17:20", "2.3.2 - Cash Flows - Direct Method | 1:45:41", "2.3.3 - Cash Flow - Indirect Method | 1:46:56", "2.3.4 - CFF, CFO and Pract Qs | 2:01:03"],
    "2.4 - Analyzing Cash Flow - 2": ["2.4.1 - Analyzing Cash Flows - 2 | 1:28:31"],
    "2.5 - Analysis of Inventories": ["2.5.1 - Analysis of Inventory - 1 | 0:56:42", "2.5.1 - Analysis of Inventory - 2 | 0:26:35", "2.5.1 - Analysis of Inventory - 3 | 0:48:45", "2.5.1 - Analysis of Inventory - 4 | 0:29:37"],
    "2.6 - Analysis of Long Term Assets": ["2.6.1 - PRQ- Long Term Assets - 1 | 1:05:22", "2.6.2 - PRQ-Long Term Assets - 2 | 1:21:31", "2.6.3 - PRQ-Long Term Assets - 3 | 1:11:50", "2.6.4 - PRQ- Long Term Assets - 4 | 0:28:16", "2.6.5 - Core Reading - Long Term Asset - 1 | 1:03:05", "2.6.6 - Core Reading - Long Term Asset - 2 | 0:36:37"],
    "2.7 - Long Term Liabilities & Equity": ["2.7.1 - Leases - 1 | 1:36:48", "2.7.2 - Leases - 2 | 1:04:41", "2.7.3 - Compensation Plans | 0:47:00", "2.7.4 - Defined Benefit Plan | 1:25:09", "2.7.5 - Stock Based Compensation | 2:01:14"],
    "2.8 - Income Tax": ["2.8.1 - Income Taxes | 1:22:22", "2.8.2 - DTA, DTL | 1:33:46"],
    "2.9 - Financial Reporting Quality": ["2.9.1 - Financial Reporting Quality - 1 | 0:41:00", "2.9.2 - Financial Reporting Quality - 2 | 0:30:05", "2.9.3 - Financial Reporting Quality - 3 | 0:20:12", "2.9.4 - Financial Reporting Quality - 4 | 0:17:12", "2.9.5 - Financial Reporting Quality - 5 | 0:25:23", "2.9.6 - Financial Reporting Quality - 6 | 1:02:08", "2.9.7 - Financial Reporting Quality - 7 | 0:19:51"],
    "2.9A - Financial Analysis Techniques": ["2.9A.1 - Ratio Analysis | 0:25:38", "2.9A.2 - Activity Ratio | 0:32:35", "2.9A.3 - Working Capital | 0:30:55", "2.9A.4 - Liquidity Ratio | 0:14:18", "2.9A.5 - Solvency Ratio | 1:18:44", "2.9A.6 - Dupont Analysis | 0:52:24", "2.9A.7 - Key Perfomance Indicator | 0:44:11"],
    "2.9B - Intro to Financial Modeling": ["2.9B.1 - Financial Modeling Intro | 0:37:40", "2.9B.2 - Errors in Modeling | 0:22:01", "2.9B.3 - Porter's Five Forces Model - 1 | 0:16:18", "2.9B.4 - Porter's Five Forces Model - 2 | 1:06:28"]
  }},
  "Corporate Issuers": { weight: "6-9%", sections: {
    "3.1 - Organizational Structure": ["3.1.1 - Info & Features - Corporate Issuer | 0:51:42", "3.1.2 - Key Features - Corporate Issuer | 0:48:18"],
    "3.2 - Investors and Stakeholders": ["3.2.1 - Lender and Shareholders | 0:28:17", "3.2.2 - Stakeholders of a Corporation | 0:39:09", "3.2.3 - Finance Motivation | 0:07:53", "3.2.4 - ESG | 0:41:24"],
    "3.3 - Corporate Governance and Conflicts": ["3.3.1 - Corporate Governance | 1:05:09", "3.3.2 - Shareholder Mechanism - 1 | 0:43:36", "3.3.3 - Shareholder Mechanism - 2 | 0:14:37"],
    "3.4 - Working Capital and Liquidity": ["3.4.1 - Intro to Cash Conversion Cycle | 0:54:24", "3.4.2 - Liquidity Levels | 0:33:13", "3.4.3 - Managing WC and Liquidity | 0:09:43", "3.4.4 - Managing Liquidity and ST sources | 0:28:17"],
    "3.5 - Capital Invt and Allocation": ["3.5.1 - IntroCapital Invt and Allocation | 0:58:16", "3.5.2 - Net Present Value | 0:31:22", "3.5.3 - IRR NPV - Adv and Disadv | 0:38:38", "3.5.4 - ROIC | 0:22:07", "3.5.5 - Capital Allocation | 0:32:19", "3.5.6 - Real Options | 0:14:57"],
    "3.6 - Capital Structure": ["3.6.1 - WACC - 1 | 0:21:12", "3.6.2 - WACC - 2 | 0:35:08", "3.6.3 - Factors affecting Capital Structure - 1 | 0:23:35", "3.6.4 - Factors affecting Capital Structure - 2 | 0:20:31", "3.6.5 - MM with Taxes | 1:39:17", "3.6.6 - MM Theory Optimal Cap Structure | 0:43:13", "3.6.7 - Peckign Order THeory | 0:43:32"],
    "3.7 - Business Model": ["3.7.1 - Business Models - Features | 0:57:40", "3.7.2 - Business Models - Types | 0:17:15"]
  }},
  "Alternative Investments": { weight: "7-10%", sections: {
    "4.1 - Features, Methods, Structure": ["4.1.1 - Al Intro, Structure | 0:40:01", "4.1.2 - Direct, Co-Investing, Fund Investing | 0:08:23", "4.1.3 - Investment Ownership, Fee Structure | 0:46:00", "4.1.4 - Fees Structure | 0:21:46"],
    "4.2 - Performance and Returns": ["4.2.1 - Timing of Cash Flow | 0:51:15", "4.2.2 - Valuation of Intruments | 0:25:04", "4.2.3 - Biases in Al | 1:06:48"],
    "4.3 - Invt in Private Debt and Equity": ["4.3.1 - PE Investment Categories | 0:55:56", "4.3.2 - Diversification Benefit | 0:27:25"],
    "4.4 - Real Estate and Infra": ["4.4.1 - Real Estate - Features and Characterstics | 1:25:15", "4.4.2 - Infra - Features and Characterstics | 0:28:09"],
    "4.5 - Natural Resources": ["4.5.1 - Natural Resources - 1 | 0:29:16", "4.5.2 - Commodity | 1:18:07"],
    "4.6 - Hedge Funds": ["4.6.1 - CFA Guidance | 0:13:05", "4.6.2 - Features of Hedge Funds | 0:46:33", "4.6.3 - Vehicles used in HF | 0:35:19"],
    "4.7 - Digital Assets": ["4.7.1 - Intro to Digital Assets | 1:16:04", "4.7.2 - Digital Asset Characterstics | 0:18:45"]
  }},
  "Equity Investments": { weight: "11-14%", sections: {
    "6.1 - Mkt Organization and Structure": ["6.1.1 - Market, Assets & Intermediaries | 0:45:11", "6.1.2 - Classification of Asset & Market | 0:11:20", "6.1.3 - Types of Securities | 0:44:27", "6.1.4 - Financial Intermediaries | 1:00:10", "6.1.5 - Securitization, Arbitrage | 0:36:19", "6.1.6 - Asset Positions, Hedging | 0:14:16", "6.1.7 - Short Sales | 0:42:16", "6.1.8 - Leverage Ratio | 0:34:49", "6.1.9 - Types of Orders - 1 | 0:46:09", "6.1.9a - Types of Orders - 2 | 0:35:34", "6.1.9b - Primary and Secondary Market | 0:52:13", "6.1.9c - Trading in diff markets | 0:17:36", "6.1.9d - Characterstics of Well financial system | 0:11:40"],
    "6.2 - Index Securities": ["6.2.1 - Intro to Index | 0:51:09", "6.2.2 - Composition of Index | 0:37:02", "6.2.3 - Calculate Value and Returns | 0:38:30", "6.2.4 - Rebalancing and Reconstitution | 0:18:57", "6.2.5 - Uses of Security Market Index | 0:27:21", "6.2.6 - Fixed Income Indexes | 0:25:49"],
    "6.3 - Market Efficiency": ["6.3.1 - Intro to Market Efficiency | 0:47:04", "6.3.2 - Factors Impact Mkt Efficiency | 0:15:53", "6.3.3 - Weak, Semi, Strong Efficiency | 0:11:39", "6.3.4 - Mkt Eff - Funda and Tech Analysis | 0:18:23", "6.3.5 - Anamolies of the Mkt - 1 | 0:12:07", "6.3.6 - Anamolies of the Mkt - 2 | 0:54:11", "6.3.7 - Behavioural Finance | 0:11:34"],
    "6.4 - Overview of Equities": ["6.4.1 - Types, Characterstics - Equity Securities | 0:25:32", "6.4.2 - Public vs Private Equity | 0:18:56", "6.4.3 - Non Domestic Equity Mkts | 0:18:24", "6.4.4 - Risk vs Returns - Diff Equities | 0:10:47", "6.4.5 - Mkt Value vs Book Value | 0:34:58"],
    "6.5 - Company Analysis Past and Present": ["6.5.1 - Initiating Coverage Report | 0:37:55", "6.5.2 - Types of Business Model | 0:24:20", "6.5.3 - Revenue, Drivers, Pricing Power - 1 | 0:15:21", "6.5.4 - Revenue, Drivers, Pricing Power - 2 | 0:26:10", "6.5.5 - Profitability and Working Cap | 0:44:44", "6.5.6 - DOL and DFL | 0:43:53"],
    "6.6 - Industry Analysis": ["6.6.1 - Intro to Industry Analysis | 0:19:57", "6.6.2 - Industry Classification Methods | 0:19:32", "6.6.3 - Industry - Size, Growth, Charaterstics | 0:16:58", "6.6.4 - Porter Five Forces | 0:32:15", "6.6.5 - PESTLE Framework | 0:23:15", "6.6.6 - Competitive Strategy and Positioning | 0:19:35"],
    "6.7 - Forecasting": ["6.7.1 - Intro to Forecasting, Quality | 0:51:16", "6.7.2 - Revenue Forecast Approach | 0:20:18", "6.7.3 - Op Exp and WC Forecasting | 0:14:47", "6.7.4 - Forecasting Cap Invt and Cap Structure | 0:10:14"],
    "6.8 - Valuation Concepts and Tools": ["6.8.1 - Intro to Valuation | 0:43:31", "6.8.2 - Categories of Eq Valuation | 0:12:18", "6.8.3 - Types of Dividends | 0:24:50", "6.8.4 - Dividend Payment Chronology | 0:08:11", "6.8.5 - Rationale to use PV Models | 0:17:35", "6.8.6 - CFA Guidance | 0:02:31", "6.8.7 - FCFE | 1:02:10", "6.8.8 - Calculate IV of Pref Stock | 0:10:44", "6.8.9 - Gordons Growth - 1 | 0:26:07", "6.8.9a - Gordons Growth - 2 | 0:38:59", "6.8.9b - Gordons Growth - 3 | 0:20:02", "6.8.9c - Estimating Growth Rates | 0:20:13", "6.8.9d - Char of Constant G and Multistage | 0:06:44", "6.8.9e - Relative Measures - 1 | 0:17:37", "6.8.9f - Relative Measures - 2 | 0:53:32", "6.8.9g - EV Multiples and Uses | 0:27:15", "6.8.9h - Asset Based Valuation Model | 0:19:42"]
  }},
  "Portfolio Management": { weight: "8-12%", sections: {
    "7.1 - Risk and Returns - One": ["7.1.1 - Intro to Risk and Returns | 0:53:56", "7.1.2 - Behaviour of Investors - 1 | 0:25:08", "7.1.3 - Behaviour of Investors - 2 | 0:23:46", "7.1.4 - Risk Free Portfolio | 0:27:40", "7.1.5 - Optimal Portfolio | 0:34:56", "7.1.6 - Portfolio Std Deviation | 0:56:43"],
    "7.2 - Risk and Returns - Two": ["7.2.1 - CAL | 0:38:47", "7.2.2 - CML | 0:20:57", "7.2.3 - Borrowed Portfolio | 0:17:56", "7.2.4 - Active vs Passive Mgmt | 0:05:35", "7.2.5 - Systematic vs Unsystematic Risk | 0:25:09", "7.2.6 - MultiFactor Model | 0:28:51", "7.2.7 - CAPM and SML | 0:22:54", "7.2.8 - Recap | 0:29:09", "7.2.9 - Portfolio Performance Evaluation | 0:54:35"],
    "7.3 - Portfolio Mgmt Overview": ["7.3.1 - Portfolio Approach, Diversification | 0:21:20", "7.3.2 - Process of Portfolio Mgmt | 0:17:51", "7.3.3 - Types of Investors | 0:16:06", "7.3.4 - Asset Mgmt Industry | 0:11:33", "7.3.5 - Mutual Funds | 0:26:52"],
    "7.4 - Basic Portfolio Planning and Construct": ["7.4.1 - Invt Policy Statement | 0:24:34", "7.4.2 - Willingness and Ability to take risk | 0:26:09", "7.4.3 - Principles of Portfolio Construction | 0:33:36", "7.4.4 - ESG Integration in Portfolio Mgmt | 0:15:21"],
    "7.5 - Behavioural Biases": ["7.5.1 - Behavioural Biases - 1 | 0:50:35", "7.5.2 - Behavioural Biases - 2 | 0:32:25", "7.5.3 - Behavioural Biases - 3 | 0:47:04"],
    "7.6 - Intro to Risk Mgmt": ["7.6.1 - Intro to RM - 1 | 0:49:05", "7.6.2 - Intro to RM - 2 | 0:40:29"]
  }},
  "Fixed Income": { weight: "11-14%", sections: {
    "8.1 - Fixed Income Instruments": ["8.1.1 - Types of Fixed Income Instruments - 1 | 1:03:28", "8.1.2 - Types of Fixed Income Instruments - 2 | 0:44:33"],
    "8.2 - Fixed Income CF and Types": ["8.2.1 - YTM | 0:21:18", "8.2.2 - Amortizing, Bullet Bond | 1:16:16", "8.2.3 - Inflation Indexed Bond | 0:11:07", "8.2.4 - Embedded Bonds | 0:59:34", "8.2.5 - Type of Bonds - legal and Regulatory | 0:37:05"],
    "8.3 - Trading and Issuance": ["8.3.1 - Trading and Issuance - 1 | 0:47:21", "8.3.2 - Trading and Issuance - 2 | 0:10:48"],
    "8.4 - Fixed Income - Pvt Issuers": ["8.4.1 - FI Pvt Issuer - 1 | 0:56:08", "8.4.2 - FI Pvt Issuer - 2 | 0:54:45", "8.4.3 - FI Pvt Issuer - 3 | 0:15:05"],
    "8.5 - Fixed Income Govt Issuers": ["8.5.1 - FI Govt Issuers - 1 | 0:33:40", "8.5.2 - FI Govt Issuers - 2 | 0:21:20"],
    "8.6 - FI Valuation - Yield and Price": ["8.6.1 - Yield and Price - 1 | 0:55:36", "8.6.2 - Yield and price - 2 | 0:39:10", "8.6.3 - Yield and price - 3 | 0:54:02", "8.6.4 - Yield and price - 4 | 0:20:14"],
    "8.7 - Yield and Spread Measures": ["8.7.1 - Yield and Spread Measures - 1 | 0:08:11", "8.7.2 - Yield and Spread Measures - 2 | 0:53:35", "8.7.3 - Yield and Spread Measures - 3 | 0:34:32"],
    "8.8 - Term Structure Yield Curve": ["8.8.1 - Term Structure Yield Curve - 1 | 0:26:48", "8.8.2 - Term Structure Yield Curve - 2 | 0:33:45", "8.8.3 - Term Structure Yield Curve - 3 | 0:17:36", "8.8.4 - Term Structure Yield Curve - 4 | 0:20:24", "8.8.5 - Term Structure Yield Curve - 5 | 1:08:33", "8.8.6 - Term Structure Yield Curve - 6 | 0:15:09", "8.8.7 - Term Structure Yield Curve - 7 | 0:26:48"],
    "8.9 - Interest Rate Risk and Return": ["8.9.1 - Intt Rate Risk and Return - 1 | 0:46:43", "8.9.2 - Intt Rate Risk and Return - 2 | 0:08:44", "8.9.3 - Intt Rate Risk and Return - 3 | 0:56:24", "8.9.1 - Intt Rate Risk and Return - 4 | 0:26:22"],
    "8.9a - Yield Based Duration": ["8.9a.1 - Yield Based Duration - 1 | 1:29:43", "8.9a.2 - Yield Based Duration - 2 | 0:27:44", "8.9a.3 - Yield Based Duration - 3 | 0:43:19", "8.9a.4 - Yield Based Duration - 4 | 0:40:26", "8.9a.5 - Yield Based Duration - 5 | 1:13:09", "8.9a.6 - Yield Based Duration - 6 | 0:49:20"],
    "8.9b - Curve Based & Empirical Measures": ["8.9b.1 - Curve Based & Empirical Measures - 1 | 0:55:19", "8.9b.2 - Curve Based & Empirical Measures - 2 | 0:26:37"],
    "8.9c - Credit Risk": ["8.9c.1 - Credit Risk - 1 | 0:57:23", "8.9c.2 - Credit Risk - 2 | 0:32:11", "8.9c.3 - Credit Risk - 3 | 0:56:55"],
    "8.9e - Credit Analysis - Govt Issuer": ["8.9e.1 - Credit Analysis - Govt - 1 | 0:17:36", "8.9e.2 - Credit Analysis - Govt - 2 | 0:07:59"],
    "8.9f - Credit Analysis - Corporate Issuer": ["8.9f.1 - Credit Analysis - Corporate - 1 | 0:25:21", "8.9f.2 - Credit Analysis - Corporate - 2 | 0:11:58", "8.9f.3 - Credit Analysis - Corporate - 3 | 0:25:41"],
    "8.9g - Securitization": ["8.9g.1 - Securitization - 1 | 1:15:55", "8.9g.2 - Securitization - 2 | 0:15:40"],
    "8.9h - ABS": ["8.9h.1 - ABS - 1 | 0:28:35", "8.9h.2 - ABS - 2 | 0:08:00", "8.9h.3 - ABS - 3 | 0:13:20", "8.9h.4 - ABS - 4 | 0:01:05", "8.9h.5 - ABS - 5 | 0:20:11", "8.9h.6 - ABS - 6 | 0:14:12"],
    "8.9i - MBS": ["8.9i.1 - MBS - 1 | 0:29:59", "8.9i.2 - MBS - 2 | 0:16:28", "8.9i.3 - MBS - 3 | 0:16:28"]
  }},
  "Derivatives": { weight: "5-8%", sections: {
    "9.0 - Intro to Derivatives": ["9.0.1 - Intro to Derivatives | 1:23:27"],
    "9.1 - Derivatives Instruments and Features": ["9.1.1 - Basic Features of Derivatives | 1:07:48", "9.1.2 - Basic Features of Deri Markets | 0:32:07"],
    "9.2 - Fwd Commitment and Contingent Claims": ["9.2.1 - Fwd Commitment vs Contingent Claim | 0:09:27", "9.2.2 - Futures | 0:31:24", "9.2.3 - Swaps | 0:37:40", "9.2.4 - Options | 0:26:19", "9.2.5 - Option Value at Expiry and Profit | 0:15:57", "9.2.6 - Options Payoffs | 0:50:03", "9.2.7 - Swaps Remaining | 0:11:31"],
    "9.3 - Derivatives - Features, Advantages": ["9.3.1 - Risk and Advantages | 0:56:40", "9.3.2 - Use of Derivatives | 0:38:47"],
    "9.4 - Derivative Arbitrage, Replication & Pricing": ["9.4.1 - Intro | 0:12:22", "9.4.2 - Spot vs Future, Cost of Carry | 0:52:54", "9.4.3 - Arbitrage | 0:36:25", "9.4.4 - Replication | 0:35:57"],
    "9.5 - Pricing Fwd & Varying Maturities": ["9.5.1 - Price vs Value | 0:48:24", "9.5.2 - Forward Rate Agreement | 0:33:30", "9.5.3 - Varying Maturies | 0:10:20"],
    "9.6 - Value & Pricing - Futures": ["9.6.1 - Value & Pricing of Futures - 1 | 0:27:33", "9.6.2 - Value & Pricing of Futures - 2 | 0:32:52"],
    "9.7 - Value & Pricing - Swaps": ["9.7.1 - Value & Pricing - Swaps | 0:58:48"],
    "9.8 - Value & Pricing - Options": ["9.8.1 - Moneyness of the Option | 0:43:19", "9.8.2 - Exercise and Time Value | 0:21:15", "9.8.3 - Option other discussions - 1 | 1:01:06", "9.8.4 - Option other discussions - 2 | 0:12:07", "9.8.5 - Factors determin Value of Option | 0:18:01"],
    "9.9 - Option Replication PCP": ["9.9.1 - Put Call Parity (PCP) | 1:02:07", "9.9.2 - Put Call Fwd Parity | 0:18:09", "9.9.3 - Application of Option Theory | 0:45:31"],
    "9.9A - Option Valuation - Binomial Model": ["9.9a.1 - Binomial Options - 1 | 0:20:41", "9.9a.2 - Binomial Options - 2 | 0:59:47", "9.9a.3 - Binomial Options - 3 | 0:17:28", "9.9a.4 - Binomial Options - 4 | 0:06:50", "9.9a.5 - Binomial Options - 5 | 0:32:28"]
  }}
};

// Utilities
const getSubjectForTopic = (topicName: string, syllabusObj: any) => {
  for (const [subject, data] of Object.entries(syllabusObj)) {
    const sections = (data as any).sections;
    for (const sectionTopics of Object.values(sections)) {
      if ((sectionTopics as string[]).includes(topicName)) return subject;
    }
  }
  return "Unknown";
};

const getTotalTopicsCount = (syllabusObj: any) => {
  return Object.values(syllabusObj).reduce((acc: number, curr: any) => {
    const sectionTopicsCount = Object.values(curr.sections).reduce((secAcc: number, section: any) => secAcc + (section as string[]).length, 0);
    return acc + sectionTopicsCount;
  }, 0);
};

const formatDuration = (dur: string | null) => {
  if (!dur || !dur.includes(':')) return dur;
  const parts = dur.trim().split(':').map(Number);
  if (parts.length === 3) {
    let [h, m, s] = parts;
    if (s >= 30) m++;
    if (m >= 60) { h++; m -= 60; }
    if (h > 0) return `${h} hr ${m > 0 ? m + ' mins' : ''}`.trim();
    return `${m} mins`;
  }
  return dur;
};

// --- 2. HELPER FUNCTIONS ---
const getLocalYMD = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getTodayStr = () => getLocalYMD(new Date());
const getDaysDiff = (dateStr1: string, dateStr2: string) => {
  const d1 = new Date(dateStr1); const d2 = new Date(dateStr2);
  d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

// --- 3. STATE MANAGEMENT (ZUSTAND) ---
interface TrackerState {
  theme: 'light' | 'dark' | 'rgb';
  syllabusType: 'official' | 'parth';
  
  completedOfficial: Record<string, string>;
  dailyOfficial: Record<string, number>;
  reviewsOfficial: Record<string, { day4: boolean; day7: boolean }>;
  
  completedParth: Record<string, string>;
  dailyParth: Record<string, number>;
  reviewsParth: Record<string, { day4: boolean; day7: boolean }>;
  
  planTopics: string[];
  planDeadline: string | null;
  setTheme: (theme: 'light' | 'dark' | 'rgb') => void;
  setSyllabusType: (type: 'official' | 'parth') => void;
  toggleTopic: (topic: string) => void;
  markReview: (topic: string, dayType: 'day4' | 'day7') => void;
  importData: (data: any) => void;
  setPlan: (topics: string[], deadline: string) => void;
  clearPlan: () => void;
}

const useStore = create<TrackerState>()(
  persist(
    (set) => ({
      theme: 'light',
      syllabusType: 'parth',
      completedOfficial: {}, dailyOfficial: {}, reviewsOfficial: {},
      completedParth: {}, dailyParth: {}, reviewsParth: {},
      planTopics: [],
      planDeadline: null,
      
      setTheme: (theme) => set(() => ({ theme })),
      setSyllabusType: (type) => set(() => ({ syllabusType: type, planTopics: [], planDeadline: null })),
      
      toggleTopic: (topic) => set((state) => {
        const todayStr = getTodayStr();
        const isOff = state.syllabusType === 'official';
        const completed = isOff ? state.completedOfficial : state.completedParth;
        const daily = isOff ? state.dailyOfficial : state.dailyParth;
        const reviews = isOff ? state.reviewsOfficial : state.reviewsParth;

        const isCompleted = !!completed[topic];
        const newCompleted = { ...completed };
        const newDaily = { ...daily };
        const newReviews = { ...reviews };

        if (isCompleted) {
          const dateCompleted = newCompleted[topic];
          delete newCompleted[topic];
          delete newReviews[topic];
          if (dateCompleted && newDaily[dateCompleted] > 0) newDaily[dateCompleted] -= 1;
        } else {
          newCompleted[topic] = todayStr;
          newDaily[todayStr] = (newDaily[todayStr] || 0) + 1;
          newReviews[topic] = { day4: false, day7: false };
        }
        
        return isOff 
          ? { completedOfficial: newCompleted, dailyOfficial: newDaily, reviewsOfficial: newReviews }
          : { completedParth: newCompleted, dailyParth: newDaily, reviewsParth: newReviews };
      }),
      
      markReview: (topic, dayType) => set((state) => {
        const isOff = state.syllabusType === 'official';
        const reviews = isOff ? state.reviewsOfficial : state.reviewsParth;
        const newReviews = { ...reviews, [topic]: { ...reviews[topic], [dayType]: true } };
        return isOff ? { reviewsOfficial: newReviews } : { reviewsParth: newReviews };
      }),
      
      importData: (data) => set(() => ({
        theme: data.theme || 'light',
        syllabusType: data.syllabusType || 'parth',
        completedOfficial: data.completedOfficial || {}, dailyOfficial: data.dailyOfficial || {}, reviewsOfficial: data.reviewsOfficial || {},
        completedParth: data.completedParth || {}, dailyParth: data.dailyParth || {}, reviewsParth: data.reviewsParth || {},
        planTopics: data.planTopics || [],
        planDeadline: data.planDeadline || null
      })),
      setPlan: (topics, deadline) => set(() => ({ planTopics: topics, planDeadline: deadline })),
      clearPlan: () => set(() => ({ planTopics: [], planDeadline: null })),
    }),
    { name: 'cfa-mono-v7' }
  )
);

// --- 4. MAIN COMPONENT ---
export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'plan' | 'data'>('dashboard');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedTopicSections, setExpandedTopicSections] = useState<Record<string, boolean>>({});
  const [expandedPlanSubjects, setExpandedPlanSubjects] = useState<Record<string, boolean>>({});
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [draftPlanTopics, setDraftPlanTopics] = useState<string[]>([]);
  const [draftDeadline, setDraftDeadline] = useState<string>('');

  const state = useStore();
  const currentSyllabus = state.syllabusType === 'parth' ? CFA_SYLLABUS_PARTH : CFA_SYLLABUS_OFFICIAL;
  const completedTopics = state.syllabusType === 'official' ? state.completedOfficial : state.completedParth;
  const dailyCompletions = state.syllabusType === 'official' ? state.dailyOfficial : state.dailyParth;
  const reviewStates = state.syllabusType === 'official' ? state.reviewsOfficial : state.reviewsParth;

  useEffect(() => { 
    setMounted(true); 
    const d = new Date();
    const daysToSunday = d.getDay() === 0 ? 7 : 7 - d.getDay();
    d.setDate(d.getDate() + daysToSunday);
    setDraftDeadline(getLocalYMD(d));
  }, []);

  const toggleSubject = (subject: string) => { setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] })); };
  const toggleTopicSection = (section: string) => { setExpandedTopicSections(prev => ({ ...prev, [section]: !prev[section] })); };
  const togglePlanSubject = (subject: string) => { setExpandedPlanSubjects(prev => ({ ...prev, [subject]: !prev[subject] })); };

  // --- STATS CALCULATIONS ---
  const activeCompletedTopics = Object.keys(completedTopics).filter(topic => getSubjectForTopic(topic, currentSyllabus) !== 'Unknown');
  const totalCompleted = activeCompletedTopics.length;
  const completionPct = Math.round((totalCompleted / getTotalTopicsCount(currentSyllabus)) * 100) || 0;
  const todayCompletedCount = dailyCompletions[getTodayStr()] || 0;
  const maxDaily = Math.max(4, ...Object.values(dailyCompletions));

  // --- HEATMAP GENERATION (FORWARD LOOKING FROM START DATE) ---
  const generateHeatmapGrid = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const completionDates = Object.values(completedTopics).sort();
    const firstCompletionStr = completionDates.length > 0 ? completionDates[0] : getLocalYMD(today);

    const [sYear, sMonth, sDay] = firstCompletionStr.split('-').map(Number);
    let startGridDate = new Date(sYear, sMonth - 1, sDay);
    startGridDate.setHours(0,0,0,0);
    
    const dayOfWeek = startGridDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startGridDate.setDate(startGridDate.getDate() - daysToMonday);
    
    const cols = [];
    let currentDate = new Date(startGridDate);
    
    for (let w = 0; w < 52; w++) { 
      const colDays = [];
      for (let d = 0; d < 7; d++) {
        const isFuture = currentDate > today;
        const dateStr = getLocalYMD(currentDate);
        const count = dailyCompletions[dateStr] || 0;
        const isAfterStart = dateStr >= firstCompletionStr;
        
        let colorClass = "bg-gray-200 border-gray-300"; 
        if (!isFuture) {
          if (count > 0) {
            if (count / maxDaily <= 0.25) colorClass = "bg-green-300 border-green-400";
            else if (count / maxDaily <= 0.50) colorClass = "bg-green-500 border-green-600";
            else if (count / maxDaily <= 0.75) colorClass = "bg-green-600 border-green-700";
            else colorClass = "bg-green-800 border-green-900";
          } else if (isAfterStart) {
            colorClass = "bg-red-500 border-red-600"; 
          }
        }

        colDays.push({ date: new Date(currentDate), dateStr, colorClass, count, isFuture });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      cols.push(colDays);
    }
    return cols;
  };

  const heatmapCols = generateHeatmapGrid();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- 1-4-7 REVIEWS ---
  const getReviews = () => {
    const day4 = []; const day7 = [];
    const todayStr = getTodayStr();
    for (const topic of activeCompletedTopics) {
      const diffDays = getDaysDiff(todayStr, completedTopics[topic]);
      const st = reviewStates[topic] || { day4: false, day7: false };
      if (diffDays >= 3 && !st.day4) day4.push(topic);
      if (diffDays >= 6 && st.day4 && !st.day7) day7.push(topic);
    }
    return { day4, day7 };
  };
  const { day4: day4Reviews, day7: day7Reviews } = getReviews();

  const handleSyllabusToggle = (type: 'official' | 'parth') => {
    if (state.syllabusType === type) return;
    const confirmed = window.confirm("Switching curriculums will start a new consistency grid and clear your active plan (your previous data is saved securely in the background). Continue?");
    if (confirmed) state.setSyllabusType(type);
  };

  // --- PLAN CALCULATIONS (FIXED: Leaves completed topics on today's list) ---
  const getPlanDetails = () => {
    if (!state.planDeadline) return null;
    const todayStr = getTodayStr();
    
    // To prevent the "conveyor belt" effect where completing a topic pulls tomorrow's topic into today,
    // we retain topics completed *today* in the active queue for calculation purposes.
    const planTopicsActive = state.planTopics.filter(t => {
      if (!completedTopics[t]) return true; // Not done yet
      if (completedTopics[t] === todayStr) return true; // Done today (keep in list so it strikes through)
      return false; // Done before today (remove from active list)
    });

    let daysLeft = getDaysDiff(state.planDeadline, todayStr);
    if (daysLeft < 1) daysLeft = 1; 

    const topicsPerDay = Math.ceil(planTopicsActive.length / daysLeft);

    const forecast = [];
    for(let i=0; i<4; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      const dayTopics = planTopicsActive.slice(i * topicsPerDay, (i + 1) * topicsPerDay);
      forecast.push({ date: targetDate, isToday: i === 0, isTomorrow: i === 1, topics: dayTopics });
    }

    // Items left should strictly reflect uncompleted items
    const strictTopicsLeft = state.planTopics.filter(t => !completedTopics[t]).length;

    return { daysLeft, topicsLeft: strictTopicsLeft, topicsPerDay, forecast };
  };

  const handleCreatePlan = () => {
    if (!draftDeadline) return alert("Select a deadline.");
    if (draftPlanTopics.length === 0) return alert("Select at least one module for the plan.");
    state.setPlan(draftPlanTopics, draftDeadline);
  };

  const handleExport = () => {
    const dataToExport = {
      theme: state.theme, syllabusType: state.syllabusType,
      completedOfficial: state.completedOfficial, dailyOfficial: state.dailyOfficial, reviewsOfficial: state.reviewsOfficial,
      completedParth: state.completedParth, dailyParth: state.dailyParth, reviewsParth: state.reviewsParth,
      planTopics: state.planTopics, planDeadline: state.planDeadline
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `cfa_backup_${getTodayStr()}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.completedOfficial || json.completedParth) {
          state.importData(json);
          alert("Data imported successfully!");
        } else {
          alert("Invalid backup file.");
        }
      } catch (err) {
        alert("Error parsing file.");
      }
    };
    reader.readAsText(file);
  };

  if (!mounted) return <div className="min-h-screen bg-[#fafafa]" />;

  const planDetails = getPlanDetails();
  const draftDaysLeft = draftDeadline ? getDaysDiff(draftDeadline, getTodayStr()) : null;

  return (
    <div className={`theme-${state.theme}`}>
      
      {/* DYNAMIC THEME ENGINE */}
      <style dangerouslySetInnerHTML={{__html: `
        .theme-dark .app-wrapper { background-color: #0a0a0a !important; color: #f3f4f6 !important; }
        .theme-dark .bg-\\[\\#fafafa\\] { background-color: #0a0a0a !important; }
        .theme-dark .bg-white { background-color: #171717 !important; }
        .theme-dark .text-black { color: #f3f4f6 !important; }
        .theme-dark .border-black { border-color: #404040 !important; }
        .theme-dark .bg-black { background-color: #f3f4f6 !important; color: #0a0a0a !important; }
        .theme-dark .text-white { color: #0a0a0a !important; }
        .theme-dark .shadow-\\[4px_4px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { box-shadow: 4px 4px 0px 0px #404040 !important; }
        .theme-dark .shadow-\\[2px_2px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { box-shadow: 2px 2px 0px 0px #404040 !important; }
        .theme-dark .shadow-\\[8px_8px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { box-shadow: 8px 8px 0px 0px #404040 !important; }
        .theme-dark .bg-gray-50 { background-color: #262626 !important; }
        .theme-dark .bg-gray-100 { background-color: #262626 !important; }
        .theme-dark .bg-gray-200 { background-color: #404040 !important; }
        .theme-dark .border-gray-100 { border-color: #262626 !important; }
        .theme-dark .border-gray-200 { border-color: #404040 !important; }
        .theme-dark .border-gray-300 { border-color: #525252 !important; }
        .theme-dark .text-gray-500 { color: #a3a3a3 !important; }
        .theme-dark .hover\\:bg-gray-50:hover { background-color: #262626 !important; }
        .theme-dark .hover\\:bg-gray-100:hover { background-color: #404040 !important; }
        .theme-dark .hover\\:bg-gray-200:hover { background-color: #525252 !important; }
        .theme-dark .hover\\:text-black:hover { color: #ffffff !important; }
        .theme-dark .accent-black { accent-color: #f3f4f6 !important; }
        .theme-dark .bg-\\[\\#ebedf0\\] { background-color: #262626 !important; border-color: #404040 !important; }

        .theme-rgb .app-wrapper { background-color: #000000 !important; color: #ffffff !important; }
        .theme-rgb .bg-\\[\\#fafafa\\] { background-color: #000000 !important; }
        .theme-rgb .bg-white { background-color: #09090b !important; }
        .theme-rgb .text-black { color: #ffffff !important; }
        .theme-rgb .bg-black { background-color: #ffffff !important; color: #000000 !important; }
        .theme-rgb .text-white { color: #000000 !important; }
        .theme-rgb .bg-gray-50 { background-color: #18181b !important; }
        .theme-rgb .bg-gray-100 { background-color: #18181b !important; }
        .theme-rgb .bg-gray-200 { background-color: #27272a !important; }
        .theme-rgb .border-gray-100 { border-color: #18181b !important; }
        .theme-rgb .border-gray-200 { border-color: #27272a !important; }
        .theme-rgb .border-gray-300 { border-color: #3f3f46 !important; }
        .theme-rgb .text-gray-500 { color: #a1a1aa !important; }
        .theme-rgb .hover\\:bg-gray-50:hover { background-color: #18181b !important; }
        .theme-rgb .hover\\:bg-gray-100:hover { background-color: #27272a !important; }
        .theme-rgb .hover\\:bg-gray-200:hover { background-color: #3f3f46 !important; }
        .theme-rgb .bg-\\[\\#ebedf0\\] { background-color: #18181b !important; border-color: #27272a !important; }
        
        @keyframes rgb-border { 0% {border-color: #ef4444;} 33% {border-color: #22c55e;} 66% {border-color: #3b82f6;} 100% {border-color: #ef4444;} }
        @keyframes rgb-shadow { 0% {box-shadow: 4px 4px 0px 0px #ef4444;} 33% {box-shadow: 4px 4px 0px 0px #22c55e;} 66% {box-shadow: 4px 4px 0px 0px #3b82f6;} 100% {box-shadow: 4px 4px 0px 0px #ef4444;} }
        @keyframes rgb-accent { 0% {accent-color: #ef4444;} 33% {accent-color: #22c55e;} 66% {accent-color: #3b82f6;} 100% {accent-color: #ef4444;} }
        @keyframes rgb-text { 0% {background-position: 0% 50%;} 100% {background-position: 100% 50%;} }
        
        .theme-rgb .border-black { animation: rgb-border 4s linear infinite !important; }
        .theme-rgb .shadow-\\[4px_4px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { animation: rgb-shadow 4s linear infinite !important; }
        .theme-rgb .shadow-\\[2px_2px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { animation: rgb-shadow 4s linear infinite !important; }
        .theme-rgb .shadow-\\[8px_8px_0px_0px_rgba\\(0\\,0\\,0\\,1\\)\\] { animation: rgb-shadow 4s linear infinite !important; }
        .theme-rgb .accent-black { animation: rgb-accent 4s linear infinite !important; }
        .theme-rgb .logo-text { background: linear-gradient(to right, #ef4444, #22c55e, #3b82f6, #ef4444); background-size: 300%; -webkit-background-clip: text; color: transparent !important; animation: rgb-text 4s linear infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="app-wrapper min-h-screen bg-[#fafafa] text-black font-mono text-xs sm:text-sm selection:bg-black selection:text-white pb-20 transition-colors duration-300">
        
        {/* Top Navigation */}
        <nav className="bg-white border-b-2 border-black px-4 md:px-8 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3 pr-4">
            <div className="bg-black text-white p-1.5 rounded-sm flex-shrink-0"><BookOpen size={18} /></div>
            <div className="relative">
              <span className="logo-text text-base font-bold uppercase tracking-tighter hidden sm:block cursor-pointer select-none whitespace-nowrap" onClick={() => setShowThemeMenu(!showThemeMenu)}>CFA_CONSOLE</span>
              <span className="block sm:hidden absolute inset-0 w-8 h-8 -ml-10" onClick={() => setShowThemeMenu(!showThemeMenu)}/>
              {showThemeMenu && (
                <div className="absolute top-full left-0 sm:left-auto mt-4 sm:mt-3 bg-white border-2 border-black p-2 flex gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                  <button onClick={() => {state.setTheme('light'); setShowThemeMenu(false)}} className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-[#fafafa] border-2 border-gray-400 hover:scale-110 transition-transform" title="Brutalist Light" />
                  <button onClick={() => {state.setTheme('dark'); setShowThemeMenu(false)}} className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-[#0a0a0a] border-2 border-gray-600 hover:scale-110 transition-transform" title="Terminal Dark" />
                  <button onClick={() => {state.setTheme('rgb'); setShowThemeMenu(false)}} className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 border-2 border-black hover:scale-110 transition-transform" title="Gamer RGB" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 font-bold uppercase tracking-tight text-[10px] sm:text-xs overflow-x-auto hide-scrollbar w-full sm:w-auto justify-end">
            <span onClick={() => setActiveTab('dashboard')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'dashboard' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[Dashboard]</span>
            <span onClick={() => setActiveTab('tracker')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'tracker' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[1-4-7]</span>
            <span onClick={() => setActiveTab('plan')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'plan' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[Plan]</span>
            <span onClick={() => setActiveTab('data')} className={`cursor-pointer transition-colors pb-1 whitespace-nowrap flex-shrink-0 ${activeTab === 'data' ? 'border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}>[Data]</span>
          </div>
        </nav>

        <main className="max-w-[1000px] mx-auto px-3 sm:px-4 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
          
          {/* --- DASHBOARD VIEW --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
              
              {/* Heatmap Card (True GitHub Flow) */}
              <div className="bg-white border-2 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-tight">Consistency_Grid</h2>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{state.syllabusType === 'parth' ? 'Parth Sir Mode' : 'Official Mode'}</span>
                </div>
                
                <div className="overflow-x-auto pb-4 pt-2">
                  {/* Months Header - Properly Z-Indexed and Aligned */}
                  <div className="flex text-[9px] text-gray-500 mb-2 ml-[24px] uppercase font-bold tracking-tighter h-3 relative">
                    {heatmapCols.map((col, i) => {
                      const isNewMonth = i === 0 || col[0].date.getMonth() !== heatmapCols[i-1][0].date.getMonth();
                      return (
                        <div key={i} className="w-[14px] flex-shrink-0 relative">
                          {isNewMonth && <span className="absolute left-0 bottom-0 z-10 bg-transparent pr-1">{months[col[0].date.getMonth()]}</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-row gap-[2px] min-w-max">
                    {/* Day Labels */}
                    <div className="flex flex-col gap-[2px] text-[9px] text-gray-500 text-right pr-2 w-[24px] font-bold uppercase tracking-tighter leading-[12px]">
                      <span className="h-[12px]"></span>
                      <span className="h-[12px]">Mon</span>
                      <span className="h-[12px]"></span>
                      <span className="h-[12px]">Wed</span>
                      <span className="h-[12px]"></span>
                      <span className="h-[12px]">Fri</span>
                      <span className="h-[12px]"></span>
                    </div>
                    {/* Columns */}
                    {heatmapCols.map((col, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-[2px] relative">
                        {col.map((day, dayIdx) => (
                          <div key={dayIdx} className={`w-[12px] h-[12px] border ${day.colorClass} relative group cursor-pointer`}>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 bg-black text-white text-[10px] px-2 py-1 whitespace-nowrap rounded-sm shadow-xl">
                              {day.isFuture ? `Future: ${day.dateStr}` : `[${day.count}] on ${day.dateStr}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-end gap-2 mt-2 text-[9px] uppercase font-bold text-gray-500 tracking-tighter">
                  <span className="mr-1">Less</span>
                  <div className="w-[12px] h-[12px] bg-gray-200 border border-gray-300"></div>
                  <div className="w-[12px] h-[12px] bg-green-300 border border-green-400"></div>
                  <div className="w-[12px] h-[12px] bg-green-500 border border-green-600"></div>
                  <div className="w-[12px] h-[12px] bg-green-600 border border-green-700"></div>
                  <div className="w-[12px] h-[12px] bg-green-800 border border-green-900"></div>
                  <span className="ml-1">More</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white border-2 border-black p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] sm:text-sm font-bold uppercase text-gray-500 mb-1">Topics</span>
                  <span className="text-xl sm:text-3xl font-bold">{totalCompleted}</span>
                </div>
                <div className="bg-black text-white border-2 border-black p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <span className="text-[10px] sm:text-sm font-bold uppercase text-gray-400 mb-1">Total_%</span>
                  <span className="text-xl sm:text-3xl font-bold">{completionPct}%</span>
                </div>
                <div className="bg-white border-2 border-black p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-[10px] sm:text-sm font-bold uppercase text-gray-500 mb-1">Today</span>
                  <span className="text-xl sm:text-3xl font-bold">{todayCompletedCount}</span>
                </div>
              </div>

              {/* 3-Level Syllabus Grid */}
              <div className="grid grid-cols-1 gap-4 pt-4 items-start">
                {Object.entries(currentSyllabus).map(([subject, data]) => {
                  const subjectTopics = Object.values(data.sections).flat();
                  const subCompleted = subjectTopics.filter(t => completedTopics[t]).length;
                  const subPct = subjectTopics.length > 0 ? Math.round((subCompleted / subjectTopics.length) * 100) : 0;
                  const isExpanded = expandedSubjects[subject];

                  return (
                    <div key={subject} className={`bg-white border-2 transition-all flex flex-col ${isExpanded ? 'border-[#ea580c] shadow-[4px_4px_0px_0px_rgba(234,88,12,1)]' : 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
                      <div onClick={() => toggleSubject(subject)} className={`p-3 sm:p-4 border-b-2 cursor-pointer flex flex-col gap-2 transition-colors ${isExpanded ? 'bg-[#ea580c] border-[#ea580c] text-white' : 'bg-gray-50 border-transparent hover:border-black text-black'}`}>
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-tight">{subject}</h3>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2 py-0.5 ${isExpanded ? 'bg-white text-[#ea580c]' : 'bg-black text-white'}`}>{subPct}%</span>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                        </div>
                        <div className={`w-full h-1 ${isExpanded ? 'bg-white/30' : 'bg-gray-200'}`}>
                          <div className={`h-full transition-all duration-300 ${isExpanded ? 'bg-white' : 'bg-black'}`} style={{ width: `${subPct}%` }} />
                        </div>
                      </div>

                      {/* LEVEL 2: TOPIC SECTIONS */}
                      {isExpanded && (
                        <div className="flex flex-col bg-white border-t-2 border-[#ea580c] p-2 sm:p-4 gap-3">
                          {Object.entries(data.sections).map(([sectionName, topics]) => {
                            const isSectionExpanded = expandedTopicSections[sectionName];
                            const secCompleted = topics.filter(t => completedTopics[t]).length;
                            
                            return (
                              <div key={sectionName} className="border-2 border-black">
                                <div onClick={() => toggleTopicSection(sectionName)} className="flex items-center justify-between p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors border-b border-transparent hover:border-black">
                                  <span className="font-bold text-[11px] sm:text-xs uppercase">{sectionName}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500">[{secCompleted}/{topics.length}]</span>
                                    {isSectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </div>
                                </div>
                                
                                {/* LEVEL 3: VIDEOS/MODULES */}
                                {isSectionExpanded && (
                                  <div className="flex flex-col border-t-2 border-black bg-white">
                                    {topics.map((topic) => (
                                      <TopicLabel 
                                        key={topic} 
                                        topic={topic} 
                                        isChecked={!!completedTopics[topic]} 
                                        state={reviewStates[topic]} 
                                        onToggle={() => state.toggleTopic(topic)} 
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- 1-4-7 TRACKER VIEW --- */}
          {activeTab === 'tracker' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Rule Explanation - Bloomberg Orange */}
              <div className="mb-6 border-b-2 border-black pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-tight mb-2">1-4-7_Spaced_Repetition</h1>
                  <div className="bg-[#fff7ed] border border-[#ea580c] p-3 max-w-xl shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]">
                    <p className="text-[#ea580c] text-[11px] sm:text-xs font-bold uppercase tracking-tight leading-relaxed !text-[#ea580c]">
                      [ RULE ]: The 1-4-7 protocol guarantees memory retention. After completing a topic (Day 1), you review it 3 days later (Day 4) and again 3 days after that (Day 7). This system strictly auto-queues your reviews based on your historical completion timestamps.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsPlanModalOpen(true)} className="bg-black text-white px-4 py-3 sm:py-2 text-xs font-bold uppercase tracking-tight hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] w-full sm:w-auto">
                  <CalendarDays size={16} /> Plan_Till_Sunday
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-[#fefce8] border-2 border-[#854d0e] shadow-[4px_4px_0px_0px_rgba(133,77,14,1)] p-4 sm:p-5 min-h-[300px] !bg-[#fefce8] !border-[#854d0e]">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-[#854d0e] mb-3 !border-[#854d0e]">
                    <span className="font-bold text-sm uppercase tracking-tight text-[#854d0e] !text-[#854d0e]">Day_4_Review</span>
                    <span className="bg-[#854d0e] text-white px-2 py-0.5 text-xs font-bold !bg-[#854d0e] !text-white">{day4Reviews.length}</span>
                  </div>
                  {day4Reviews.length === 0 ? (
                    <div className="text-center text-[#854d0e]/60 py-10 text-xs uppercase tracking-widest !text-[#854d0e]/60">[ Queue_Empty ]</div>
                  ) : (
                    <div className="flex flex-col gap-0 border border-[#854d0e] bg-white !border-[#854d0e]">
                      {day4Reviews.map((topic, i) => {
                        const [topicName, rawDuration] = topic.includes(' | ') ? topic.split(' | ') : [topic, null];
                        const duration = formatDuration(rawDuration);
                        return (
                          <label key={topic} className={`flex items-start gap-3 py-3 px-2 sm:p-3 cursor-pointer hover:bg-amber-50 ${i !== day4Reviews.length - 1 ? 'border-b border-amber-200 !border-amber-200' : ''}`}>
                            <div className="pt-[2px] sm:pt-0.5">
                              <input type="checkbox" onChange={() => state.markReview(topic, 'day4')} className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-[#854d0e] rounded-none !accent-[#854d0e]" />
                            </div>
                            <span className="text-xs text-[#854d0e] font-bold leading-snug !text-[#854d0e] flex-1">
                              {topicName}
                              {duration && <span className="ml-2 whitespace-nowrap">[{duration}]</span>}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-[#f0fdf4] border-2 border-[#166534] shadow-[4px_4px_0px_0px_rgba(22,101,52,1)] p-4 sm:p-5 min-h-[300px] !bg-[#f0fdf4] !border-[#166534]">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-[#166534] mb-3 !border-[#166534]">
                    <span className="font-bold text-sm uppercase tracking-tight text-[#166534] !text-[#166534]">Day_7_Review</span>
                    <span className="bg-[#166534] text-white px-2 py-0.5 text-xs font-bold !bg-[#166534] !text-white">{day7Reviews.length}</span>
                  </div>
                  {day7Reviews.length === 0 ? (
                    <div className="text-center text-[#166534]/60 py-10 text-xs uppercase tracking-widest !text-[#166534]/60">[ Queue_Empty ]</div>
                  ) : (
                    <div className="flex flex-col gap-0 border border-[#166534] bg-white !border-[#166534]">
                      {day7Reviews.map((topic, i) => {
                        const [topicName, rawDuration] = topic.includes(' | ') ? topic.split(' | ') : [topic, null];
                        const duration = formatDuration(rawDuration);
                        return (
                          <label key={topic} className={`flex items-start gap-3 py-3 px-2 sm:p-3 cursor-pointer hover:bg-emerald-50 ${i !== day7Reviews.length - 1 ? 'border-b border-emerald-200 !border-emerald-200' : ''}`}>
                            <div className="pt-[2px] sm:pt-0.5">
                              <input type="checkbox" onChange={() => state.markReview(topic, 'day7')} className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-[#166534] rounded-none !accent-[#166534]" />
                            </div>
                            <span className="text-xs text-[#166534] font-bold leading-snug !text-[#166534] flex-1">
                              {topicName}
                              {duration && <span className="ml-2 whitespace-nowrap">[{duration}]</span>}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- PLAN VIEW --- */}
          {activeTab === 'plan' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-lg font-bold uppercase tracking-tight mb-1">Dynamic_Planner</h1>
                  <p className="text-gray-500 text-xs">Auto-schedules specific modules based on your deadline.</p>
                </div>
              </div>

              {!state.planDeadline ? (
                /* Setup Plan Form */
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6">
                  <h2 className="text-sm font-bold uppercase mb-6 flex items-center gap-2">
                    <Target size={18} /> Initialize_New_Plan
                  </h2>
                  
                  <div className="mb-6">
                    <label className="flex items-center text-xs font-bold uppercase mb-2">
                      1. Target_Deadline
                      {draftDaysLeft !== null && draftDaysLeft >= 0 && (
                        <span className="ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-200">[{draftDaysLeft} DAYS AWAY]</span>
                      )}
                    </label>
                    <input type="date" value={draftDeadline} onChange={(e) => setDraftDeadline(e.target.value)} className="border-2 border-black p-3 sm:p-2 font-mono text-sm w-full sm:max-w-xs focus:outline-none focus:ring-0 rounded-none bg-white text-black" />
                  </div>

                  <div className="mb-8">
                    <label className="block text-xs font-bold uppercase mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
                      <span>2. Select_Topics_To_Include</span>
                      <span className="text-gray-500 font-normal">[{draftPlanTopics.length} Queued]</span>
                    </label>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(currentSyllabus).map(([subject, data]) => {
                        const subjectTopics = Object.values(data.sections).flat();
                        const isAllSelected = subjectTopics.every(t => draftPlanTopics.includes(t));
                        const isSomeSelected = subjectTopics.some(t => draftPlanTopics.includes(t)) && !isAllSelected;
                        const isExpanded = expandedPlanSubjects[subject];

                        return (
                          <div key={subject} className={`border-2 transition-all flex flex-col bg-white ${isExpanded ? 'border-[#ea580c] shadow-[2px_2px_0px_0px_rgba(234,88,12,1)]' : 'border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                            <div className={`flex items-center gap-3 p-3 sm:p-4 transition-colors ${isExpanded ? 'bg-[#ea580c] text-white border-b-2 border-[#ea580c]' : 'hover:bg-gray-50 border-b-2 border-transparent text-black'}`}>
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                ref={input => { if (input) input.indeterminate = isSomeSelected }}
                                onChange={() => {
                                  if (isAllSelected) {
                                    setDraftPlanTopics(prev => prev.filter(t => !subjectTopics.includes(t)));
                                  } else {
                                    setDraftPlanTopics(prev => Array.from(new Set([...prev, ...subjectTopics])));
                                  }
                                }}
                                className={`w-4 h-4 rounded-none cursor-pointer flex-shrink-0 ${isExpanded ? 'accent-white' : 'accent-black'}`}
                              />
                              <span className="font-bold text-xs sm:text-sm uppercase cursor-pointer flex-1 select-none leading-tight" onClick={() => togglePlanSubject(subject)}>
                                {subject}
                              </span>
                              <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${isExpanded ? 'text-white' : 'text-gray-500'}`}>
                                [{subjectTopics.filter(t => draftPlanTopics.includes(t)).length}/{subjectTopics.length}]
                              </span>
                              <button onClick={() => togglePlanSubject(subject)} className={`p-1 transition-colors flex-shrink-0 ${isExpanded ? 'text-white hover:bg-white/20' : 'hover:bg-gray-200 border border-transparent hover:border-black'}`}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            </div>
                            
                            {isExpanded && (
                              <div className="p-1 sm:p-2 flex flex-col bg-gray-50 gap-2 border-t-2 border-[#ea580c]">
                                {Object.entries(data.sections).map(([sectionName, topics]) => (
                                  <div key={sectionName} className="border border-gray-300">
                                    <div className="bg-gray-200 p-2 text-[10px] font-bold uppercase">{sectionName}</div>
                                    <div className="bg-white flex flex-col">
                                      {topics.map(topic => {
                                        const isTopicSelected = draftPlanTopics.includes(topic);
                                        const [topicName, rawDur] = topic.includes(' | ') ? topic.split(' | ') : [topic, null];
                                        return (
                                          <label key={topic} className="flex items-start gap-3 py-2 px-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0">
                                            <div className="pt-[2px] sm:pt-0.5">
                                              <input
                                                type="checkbox"
                                                checked={isTopicSelected}
                                                onChange={() => {
                                                  if (isTopicSelected) setDraftPlanTopics(prev => prev.filter(t => t !== topic));
                                                  else setDraftPlanTopics(prev => [...prev, topic]);
                                                }}
                                                className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-black rounded-none cursor-pointer"
                                              />
                                            </div>
                                            <span className="text-xs text-black leading-snug flex-1">
                                              {topicName} {rawDur && <span className="text-[#ea580c] font-bold !text-[#ea580c]">[{formatDuration(rawDur)}]</span>}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={handleCreatePlan} className="bg-black text-white px-6 py-4 sm:py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors w-full flex justify-center items-center gap-2">
                    <CheckCircle2 size={18} /> GENERATE_SCHEDULE
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Target_Deadline</span>
                      <span className="text-xl sm:text-2xl font-bold text-emerald-400 !text-emerald-400">{state.planDeadline}</span>
                    </div>
                    <div className="flex flex-wrap gap-6 sm:gap-8 w-full sm:w-auto">
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Days_Left</span>
                        <span className="text-lg sm:text-xl font-bold">{planDetails?.daysLeft}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Items_Left</span>
                        <span className="text-lg sm:text-xl font-bold">{planDetails?.topicsLeft}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Required_Pace</span>
                        <span className="text-lg sm:text-xl font-bold text-blue-400 !text-blue-400">{planDetails?.topicsPerDay}/DAY</span>
                      </div>
                    </div>
                    <button onClick={state.clearPlan} className="w-full md:w-auto border border-gray-600 text-gray-300 px-3 py-2 sm:py-1 text-xs hover:bg-gray-800 uppercase font-bold transition-colors">
                      Reset_Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {planDetails?.forecast.map((dayPlan, idx) => (
                      <div key={idx} className={`${dayPlan.isToday ? 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-black' : 'bg-gray-50 border-gray-300 border-dashed'} border-2 p-4`}>
                        <div className={`flex justify-between items-center pb-3 mb-3 ${dayPlan.isToday ? 'border-b-2 border-black' : 'border-b-2 border-gray-300'}`}>
                          <span className={`font-bold text-sm uppercase tracking-tight flex items-center gap-2 ${dayPlan.isToday ? 'text-black' : 'text-gray-500'}`}>
                            {dayPlan.isToday ? <ListTodo size={16}/> : null} 
                            {dayPlan.isToday ? "TODAY" : dayPlan.isTomorrow ? "TOMORROW" : dayPlan.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        
                        {dayPlan.topics.length === 0 ? (
                          <div className="text-center text-gray-400 py-6 text-xs uppercase tracking-widest">[ Empty ]</div>
                        ) : (
                          <div className="flex flex-col gap-3 sm:gap-2">
                            {dayPlan.topics.map((t, tIdx) => {
                              const subject = getSubjectForTopic(t, currentSyllabus);
                              const [topicName, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                              const duration = formatDuration(rawDur);
                              
                              if (dayPlan.isToday) {
                                return (
                                  <label key={tIdx} className="flex items-start gap-3 p-3 sm:p-2 bg-gray-50 border border-gray-200 border-l-4 border-l-black cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="pt-[2px]">
                                      <input type="checkbox" checked={!!completedTopics[t]} onChange={() => state.toggleTopic(t)} className="w-4 h-4 sm:w-3.5 sm:h-3.5 accent-black rounded-none cursor-pointer" />
                                    </div>
                                    <div className={`flex flex-col flex-1 leading-tight font-bold ${completedTopics[t] ? 'opacity-40 line-through' : 'text-black'}`}>
                                      <span className={`mr-1 uppercase text-[10px] ${completedTopics[t] ? 'text-gray-500' : 'text-[#ea580c]'}`}>[{subject}]</span>
                                      <span className="mt-1">{topicName}</span>
                                      {duration && <span className={`font-bold mt-1 text-[10px] ${completedTopics[t] ? 'text-gray-500' : 'text-[#ea580c]'}`}>[{duration}]</span>}
                                    </div>
                                  </label>
                                );
                              }

                              return (
                                <div key={tIdx} className={`text-xs p-2 leading-tight font-bold flex flex-col ${completedTopics[t] ? 'opacity-40 line-through border-l-2 border-l-gray-200 text-gray-400' : 'text-gray-500 border-l-2 border-l-gray-300'}`}>
                                  <span className={`mr-1 uppercase ${completedTopics[t] ? 'text-gray-400' : 'text-[#ea580c]'}`}>[{subject}]</span>
                                  <span className="block mt-1">{topicName}</span>
                                  {duration && <span className={`font-bold block mt-1 ${completedTopics[t] ? 'text-gray-400' : 'text-[#ea580c]'}`}>[{duration}]</span>}
                                </div>
                              );
                            })}
                            {dayPlan.isToday && <div className="text-[9px] text-gray-400 mt-2 italic">*Completed items remain until tomorrow's refresh.</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- DATA & WEIGHTAGE VIEW --- */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                  <Settings size={18} />
                  <h2 className="text-sm font-bold uppercase tracking-tight">Curriculum_Mode</h2>
                </div>
                <div className="flex items-start gap-3 mb-4 p-3 bg-amber-50 border border-amber-200">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-bold leading-snug">
                    Warning: Switching modes will reset the consistency grid to match the selected syllabus and clear your active planner schedule. Your previous data is securely saved in the background.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row bg-gray-100 p-1 border-2 border-black gap-1 sm:gap-0">
                  <button onClick={() => handleSyllabusToggle('official')} className={`flex-1 py-3 sm:py-2 text-xs font-bold uppercase tracking-tight transition-colors ${state.syllabusType === 'official' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}>
                    Official Modules
                  </button>
                  <button onClick={() => handleSyllabusToggle('parth')} className={`flex-1 py-3 sm:py-2 text-xs font-bold uppercase tracking-tight transition-colors ${state.syllabusType === 'parth' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-200'}`}>
                    Parth Sir Topics
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                    <PieChart size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-tight">Exam_Weightage</h2>
                  </div>
                  <div className="flex flex-col border border-black">
                    {Object.entries(currentSyllabus).sort((a,b) => parseInt(b[1].weight) - parseInt(a[1].weight)).map(([sub, data], idx, arr) => (
                      <div key={sub} className={`flex justify-between p-3 sm:p-2 text-xs ${idx !== arr.length - 1 ? 'border-b border-gray-200' : ''}`}>
                        <span className="font-bold">{sub}</span>
                        <span className="bg-gray-100 px-1 border border-gray-300">{data.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
                    <Download size={18} />
                    <h2 className="text-sm font-bold uppercase tracking-tight">System_Data</h2>
                  </div>
                  <p className="text-xs text-gray-600 mb-6">Export your local browser data to a JSON file to transfer between devices. Import an existing JSON file to restore progress.</p>
                  <div className="flex flex-col gap-4">
                    <button onClick={handleExport} className="w-full bg-black text-white px-4 py-4 sm:py-3 text-xs font-bold uppercase tracking-tight hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                      <Download size={16} /> Export_Backup.json
                    </button>
                    <div className="relative">
                      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white border-2 border-black text-black px-4 py-4 sm:py-3 text-xs font-bold uppercase tracking-tight hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                        <Upload size={16} /> Import_Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>

        {/* FIXED PLAN MODAL */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-100">
                <h3 className="font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                  <CalendarDays size={18} /> Review_Projections
                </h3>
                <button onClick={() => setIsPlanModalOpen(false)} className="text-black hover:bg-gray-200 transition-colors p-2 sm:p-1 border border-transparent hover:border-black"><X size={18}/></button>
              </div>
              
              <div className="p-4 overflow-y-auto space-y-4 bg-[#fafafa]">
                {(() => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  
                  let daysUntilSunday = 7 - today.getDay(); 
                  if (daysUntilSunday === 0) daysUntilSunday = 7; 
                  
                  const daysArray = Array.from({length: daysUntilSunday + 1}, (_, i) => i);
                  let hasAnyReviews = false;

                  const planBlocks = daysArray.map(i => {
                    const targetDate = new Date(today);
                    targetDate.setDate(targetDate.getDate() + i);
                    const targetDateStr = getLocalYMD(targetDate);
                    
                    const d4 = []; const d7 = [];
                    for (const topic of activeCompletedTopics) {
                      const diffDays = getDaysDiff(targetDateStr, completedTopics[topic]);
                      if (diffDays === 3) d4.push(topic);
                      if (diffDays === 6) d7.push(topic);
                    }

                    if (d4.length === 0 && d7.length === 0) return null;
                    hasAnyReviews = true;

                    return (
                      <div key={i} className="border-2 border-black bg-white p-3">
                        <div className="flex justify-between items-end border-b border-gray-200 pb-2 mb-2">
                          <span className="font-bold text-xs sm:text-sm uppercase">
                            {i === 0 ? "> TODAY" : i === 1 ? "> TOMORROW" : `> ${targetDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}`}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 font-bold">{targetDateStr}</span>
                        </div>
                        
                        {d4.length > 0 && (
                          <div className="mb-3">
                            <span className="text-[10px] font-bold text-[#854d0e] uppercase bg-[#fefce8] px-1 border border-[#854d0e] inline-block mb-1 !text-[#854d0e] !border-[#854d0e] !bg-[#fefce8]">Queue: Day_4</span>
                            <ul className="space-y-3 sm:space-y-2">
                              {d4.map(t => {
                                const subject = getSubjectForTopic(t, currentSyllabus);
                                const [topicName, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                                const duration = formatDuration(rawDur);
                                return (
                                  <li key={t} className="text-xs text-black before:content-['-'] before:mr-2 flex flex-col pl-3 -indent-3">
                                    <span>
                                      <span className="text-[#ea580c] mr-1 uppercase font-bold !text-[#ea580c]">[{subject}]</span>
                                      {topicName}
                                    </span>
                                    {duration && <span className="text-[#ea580c] font-bold mt-0.5 !text-[#ea580c]">[{duration}]</span>}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}
                        {d7.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-[#166534] uppercase bg-[#f0fdf4] px-1 border border-[#166534] inline-block mb-1 !text-[#166534] !border-[#166534] !bg-[#f0fdf4]">Queue: Day_7</span>
                            <ul className="space-y-3 sm:space-y-2">
                              {d7.map(t => {
                                const subject = getSubjectForTopic(t, currentSyllabus);
                                const [topicName, rawDur] = t.includes(' | ') ? t.split(' | ') : [t, null];
                                const duration = formatDuration(rawDur);
                                return (
                                  <li key={t} className="text-xs text-black before:content-['-'] before:mr-2 flex flex-col pl-3 -indent-3">
                                    <span>
                                      <span className="text-[#ea580c] mr-1 uppercase font-bold !text-[#ea580c]">[{subject}]</span>
                                      {topicName}
                                    </span>
                                    {duration && <span className="text-[#ea580c] font-bold mt-0.5 !text-[#ea580c]">[{duration}]</span>}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  });

                  if (!hasAnyReviews) {
                    return <div className="text-center p-8 text-xs font-bold uppercase tracking-widest text-gray-400 border-2 border-dashed border-gray-300">No projections found</div>;
                  }

                  return planBlocks;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}