import type { ReportData } from '../types';

export function createDefaultReportData(make?: string, model?: string, year?: number, mileage?: number, plate?: string, vin?: string): ReportData {
  const vehicleDisplay = [year, make, model].filter(Boolean).join(' ') || 'Unknown Vehicle';
  const currentMileage = mileage ? `${mileage.toLocaleString()} mi` : '---';
  const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '/');

  return {
    searchDate: today,
    accidentsCount: 0,
    recallsCount: 0,
    titleRecordsCount: 0,
    junkSalvageCount: 0,
    totalLossCount: 0,
    problemChecksCount: 0,

    vehicleDisplay,
    plateNumber: plate || vin || '---',
    currentMileage,
    titleRecordsStatus: 'No Records Found',
    accidentsStatus: 'No Records Found',
    junkSalvageStatus: 'No Records Found',
    totalLossStatus: 'No Records Found',
    problemChecksStatus: 'No Records Found',
    recallsStatus: 'No Records Found',
    greatNewsMessage: 'No accident or junk/salvage records have been reported by any state authority.',

    financialLegalStatus: 'Clear',
    insuranceWriteoffStatus: 'Clear',
    accidentRecordsStatus: 'Clear',
    theftStolenStatus: 'Clear',

    motHistory: [
      {
        year: String(new Date().getFullYear()),
        result: 'PASSED',
        dateOfTest: today,
        expiryDate: today,
        mileage: currentMileage,
        testNumber: '---',
      },
    ],

    colour: '---',
    engine: '---',
    maxTorque: '---',
    topSpeed: '---',
    gearbox: '---',
    marketValue: '---',
    motStatus: 'Clear / Valid',
    lastReportedMileage: currentMileage,
    estimatedMileage: '---',

    vehicleClass: '---',
    consumptionCity: '---',
    motStatusGeneral: 'Current (Valid)',
    wheelPlan: '---',

    cylinders: '---',
    camType: '---',
    fuelInduction: '---',
    fuelType: '---',
    valves: '---',
    maxHorsepower: '---',
    totalMaxTorque: '---',
    transmissionEngine: '---',

    fuelGrade: '---',
    cityEconomy: '---',
    highwayEconomy: '---',
    combinedEconomy: '---',

    floodDamage: false,
    fireDamage: false,
    hailDamage: false,
    junkTitle: false,
    totaled: false,
    salvage: false,
    formerRental: false,

    priorTaxi: false,
    odometerNotActual: false,
    vandalism: false,
    rebuilt: false,
    dismantled: false,
    collision: false,
    priorPolice: false,

    warrantyReturn: false,
    partsOnly: false,
    recoveredTheft: false,
    undisclosedLien: false,
    antiqueClassic: false,
    agriculturalVehicle: false,
    reissuedVIN: false,

    manufacturerBuyBack: false,
    salvageStolen: false,
    crushed: false,
    inoperableVehicle: false,
    hazardous: false,
    exportOnlyVehicle: false,
    odometerTampering: false,
    grayMarket: false,

    odometerExceedsLimits: false,
    odometerAltered: false,
    odometerReplaced: false,
    odometerDiscrepancy: false,
    pendingJunk: false,
    junkAutomobile: false,

    recallsMessage: 'No manufacturer campaigns or active recalls have been reported for this vehicle.',

    frontAirbags: 'Equipped',
    sideAirbags: 'Not Equipped',
    sideCurtainAirbags: 'Equipped',
    abs: 'Equipped',
    brakingAssist: 'Equipped',
    electronicBrakeforceDistribution: 'Equipped',
    activeHeadRestraints: 'Equipped',
    childSafetyDoorLocks: 'Not Equipped',
    childSeatAnchors: 'Equipped',
    crumpleZones: 'Equipped',
    emergencyInteriorTrunkRelease: 'Equipped',

    hillHolderControl: 'Equipped',
    stabilityControl: 'Not Equipped',
    tractionControl: 'Equipped',
    antiTheftSystem: 'Equipped',
    powerDoorLocks: 'Equipped',
    frontSeatbelts: 'Equipped',
    rearSeatbelts: 'Equipped',
    seatbeltPretensioners: 'Equipped',
    seatbeltWarningSensor: 'Equipped',

    auditSummaryText: `Clean Bill of Health — This vehicle has covered ${currentMileage}. No accident, salvage, theft, flood damage, or odometer tampering negative records found.`,
    marketValueSummary: `Market value is estimated at ${mileage ? '---' : '---'} with a Clear / Valid MOT.`,
    motSummary: 'Clear / Valid',
    disclaimerText: 'The information presented in this report may have changed significantly since the date of this inquiry. This report is for informational purposes only. We recommend an independent inspection before purchase. We are not liable for any decisions made based on this report.',

    email: 'info@example.com',
    website: 'https://example.com/',
    tagline: 'One VIN. Complete History.',
    securedBy: 'Secured by Brand',
  };
}
