/**
 * Comprehensive Test Suite for TECH CAMPUS - REC Hostel Maintenance System
 * Category-Based Technician Assignment & Specialization Enforcement Tests:
 * 1. Category-to-Specialization mapping rules (Electrical, Plumbing, Water Supply, Bathroom, Drainage, Furniture, Room Maintenance, Cleanliness, Wi-Fi/Internet, Other)
 * 2. Electrical complaint assigned ONLY to Electrical Technician (Selvam)
 * 3. Plumbing / Water Supply / Bathroom / Drainage complaints assigned ONLY to Plumbing Technician (Murugan)
 * 4. Furniture complaint assigned ONLY to Furniture / Carpenter Technician (Karthik)
 * 5. Wi-Fi / Internet complaint assigned ONLY to Network Technician (Vignesh)
 * 6. Workload load-balancing between multiple eligible technicians with the same specialization
 * 7. No available technician scenario: leaves complaint in PENDING_ASSIGNMENT / UNASSIGNED, notifies Admin, never assigns to unrelated technician
 * 8. Admin manual assignment validation: blocks specialization mismatch unless authorized override with justification is provided
 * 9. Reassignment removes previous active assignment, updates workloads, and preserves reassignment history
 * 10. Worker isolation: electrical technician sees only their jobs; plumbing technician sees only their jobs
 */

import { dbService } from '../server/db';
import {
  getRequiredSpecializationForCategory,
  isTechnicianSpecializedIn,
} from '../src/types';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (failureDetails) console.error(`    Details: ${failureDetails}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('TECH CAMPUS - CATEGORY-BASED TECHNICIAN ASSIGNMENT TESTS');
  console.log('======================================================\n');

  // Domain 1: Category Normalization & Specialization Mapping Rules
  console.log('[Domain 1] Category-to-Specialization Mapping Rules');
  assert(
    getRequiredSpecializationForCategory('Electrical') === 'Electrical',
    'Electrical maps to Electrical Technician'
  );
  assert(
    getRequiredSpecializationForCategory('electrical') === 'Electrical',
    'lowercase "electrical" maps to Electrical'
  );
  assert(
    getRequiredSpecializationForCategory('Plumbing') === 'Plumbing',
    'Plumbing maps to Plumbing Technician'
  );
  assert(
    getRequiredSpecializationForCategory('Water Supply') === 'Plumbing',
    'Water Supply maps to Plumbing Technician'
  );
  assert(
    getRequiredSpecializationForCategory('Bathroom') === 'Plumbing',
    'Bathroom maps to Plumbing Technician'
  );
  assert(
    getRequiredSpecializationForCategory('Drainage') === 'Plumbing',
    'Drainage maps to Plumbing Technician'
  );
  assert(
    getRequiredSpecializationForCategory('Furniture') === 'Furniture',
    'Furniture maps to Furniture Technician / Carpenter'
  );
  assert(
    getRequiredSpecializationForCategory('Room Maintenance') === 'Room Maintenance',
    'Room Maintenance maps to General Maintenance'
  );
  assert(
    getRequiredSpecializationForCategory('Cleanliness') === 'Cleanliness',
    'Cleanliness maps to Housekeeping Staff'
  );
  assert(
    getRequiredSpecializationForCategory('Wi-Fi / Internet') === 'Wi-Fi / Internet',
    'Wi-Fi / Internet maps to Network Technician'
  );
  assert(
    getRequiredSpecializationForCategory('Other') === 'General Maintenance',
    'Other maps to General Maintenance'
  );

  // Domain 2: Specialization Compatibility Checking
  console.log('\n[Domain 2] Specialization Compatibility Checker');
  assert(
    isTechnicianSpecializedIn('Electrical', ['Electrical'], 'Electrical') === true,
    'Electrical technician matches Electrical complaint'
  );
  assert(
    isTechnicianSpecializedIn('Plumbing', ['Plumbing'], 'Electrical') === false,
    'Plumbing technician DOES NOT match Electrical complaint'
  );
  assert(
    isTechnicianSpecializedIn('Electrical', ['Electrical'], 'Plumbing') === false,
    'Electrical technician DOES NOT match Plumbing complaint'
  );
  assert(
    isTechnicianSpecializedIn('Plumbing', ['Plumbing', 'Water Supply'], 'Plumbing') === true,
    'Plumbing technician matches Plumbing complaint'
  );

  // Clean up any temporary test workers from previous runs
  const preWorkers = await dbService.getAllWorkers();
  for (const w of preWorkers) {
    if (w.email && w.email.includes('test.electrician')) {
      await dbService.deleteWorker(w.id);
    }
  }

  // Retrieve standard technicians
  const allWorkers = await dbService.getAllWorkers();
  const electricalWorker = allWorkers.find((w) => w.specialization === 'Electrical' && w.email?.includes('selvam')) || allWorkers.find((w) => w.specialization === 'Electrical')!;
  const plumbingWorker = allWorkers.find((w) => w.specialization === 'Plumbing' && w.email?.includes('murugan')) || allWorkers.find((w) => w.specialization === 'Plumbing')!;
  const furnitureWorker = allWorkers.find((w) => w.specialization === 'Furniture')!;
  const networkWorker = allWorkers.find((w) => w.specialization === 'Wi-Fi / Internet')!;

  // Reset initial workloads for clean test run
  await dbService.updateWorkerStatus(electricalWorker.id, { current_workload: 0, availability_status: 'available' });
  await dbService.updateWorkerStatus(plumbingWorker.id, { current_workload: 0, availability_status: 'available' });

  assert(electricalWorker !== undefined, 'Electrical technician exists in database');
  assert(plumbingWorker !== undefined, 'Plumbing technician exists in database');

  // Test Student
  const student = (await dbService.getAllProfiles('student'))[0];
  const admin = (await dbService.getAllProfiles('admin'))[0];

  // Domain 3: Electrical Complaint Assignment
  console.log('\n[Domain 3] Electrical Complaint Assignment Verification');
  const elecTicketRes = await dbService.createComplaint({
    reporter_id: student.id,
    complaint_type: 'ROOM',
    hostel: 'Ruby',
    location_detail: 'Room 304',
    category: 'Electrical',
    priority: 'HIGH',
    description: 'Ceiling fan capacitor burnt and sparking in switchboard.',
  });

  assert(
    elecTicketRes.assignedWorker !== undefined,
    'Electrical complaint was automatically assigned'
  );
  assert(
    elecTicketRes.assignedWorker?.specialization === 'Electrical',
    'Electrical complaint assigned ONLY to Electrical Technician (Selvam)'
  );
  assert(
    elecTicketRes.assignedWorker?.id === electricalWorker.id,
    'Assigned worker ID strictly equals Electrical worker ID'
  );
  assert(
    elecTicketRes.assignedWorker?.id !== plumbingWorker.id,
    'Electrical complaint is NEVER assigned to Plumbing technician'
  );
  assert(
    elecTicketRes.assignedWorker?.id !== furnitureWorker?.id,
    'Electrical complaint is NEVER assigned to Furniture technician'
  );

  // Domain 4: Plumbing & Water Supply Complaint Assignment
  console.log('\n[Domain 4] Plumbing, Water Supply & Drainage Complaints');
  const plumbTicketRes = await dbService.createComplaint({
    reporter_id: student.id,
    complaint_type: 'ROOM',
    hostel: 'Ruby',
    location_detail: 'Room 304',
    category: 'Water Supply',
    priority: 'HIGH',
    description: 'Water supply line disconnected under washroom sink.',
  });

  assert(
    plumbTicketRes.assignedWorker !== undefined,
    'Water Supply complaint was automatically assigned'
  );
  assert(
    plumbTicketRes.assignedWorker?.specialization === 'Plumbing',
    'Water Supply complaint assigned ONLY to Plumbing Technician (Murugan)'
  );
  assert(
    plumbTicketRes.assignedWorker?.id === plumbingWorker.id,
    'Assigned worker ID strictly equals Plumbing worker ID'
  );
  assert(
    plumbTicketRes.assignedWorker?.id !== electricalWorker.id,
    'Plumbing complaint is NEVER assigned to Electrical technician'
  );

  // Domain 5: Wi-Fi / Internet Complaint Assignment
  console.log('\n[Domain 5] Wi-Fi / Internet Complaint Assignment');
  const wifiTicketRes = await dbService.createComplaint({
    reporter_id: student.id,
    complaint_type: 'ROOM',
    hostel: 'Ruby',
    location_detail: 'Floor 3 Wi-Fi Access Point',
    category: 'Wi-Fi / Internet',
    priority: 'MEDIUM',
    description: 'Hostel corridor Wi-Fi router keeps resetting and dropping signal.',
  });

  assert(
    wifiTicketRes.assignedWorker?.specialization === 'Wi-Fi / Internet',
    'Wi-Fi complaint assigned ONLY to Network Technician'
  );

  // Domain 6: Multiple Eligible Technicians Load-Balancing Strategy
  console.log('\n[Domain 6] Multiple Technicians Load-Balancing (Fewest Active Complaints)');
  // Create a second electrical technician with higher workload
  const testWorker2Email = `test.electrician.${Date.now()}@rec.ac.in`;
  const worker2Creation = await dbService.createWorker({
    name: 'Praveen K. (Assistant Electrician)',
    email: testWorker2Email,
    specialization: 'Electrical',
    skills: ['Electrical'],
    hostel_coverage: ['Ruby', 'Emerald', 'Pearl'],
    max_workload: 5,
    rawPassword: 'Worker@REC2026!',
  });

  // Manually set worker 2's workload higher than worker 1
  const allWorkersUpdated = await dbService.getAllWorkers();
  const tech1 = allWorkersUpdated.find((w) => w.id === electricalWorker.id)!;
  const tech2 = allWorkersUpdated.find((w) => w.id === worker2Creation.worker.id)!;

  await dbService.updateWorkerStatus(tech2.id, { current_workload: tech1.current_workload + 2 });

  const elecTicket2 = await dbService.createComplaint({
    reporter_id: student.id,
    complaint_type: 'ROOM',
    hostel: 'Emerald',
    location_detail: 'Room 205',
    category: 'Electrical',
    priority: 'MEDIUM',
    description: 'Desk reading light switch is defective.',
  });

  assert(
    elecTicket2.assignedWorker?.id === tech1.id,
    'Dispatched to technician with fewest active assigned complaints (tech1)'
  );

  // Clean up temporary technician
  await dbService.deleteWorker(tech2.id);

  // Domain 7: No Matching Technician Scenario
  console.log('\n[Domain 7] No Available Matching Technician Handling');
  // Temporarily mark all plumbing technicians as busy / off duty
  const plumbWorkers = (await dbService.getAllWorkers()).filter(
    (w) => w.specialization === 'Plumbing'
  );
  for (const pw of plumbWorkers) {
    await dbService.updateWorkerStatus(pw.id, { availability_status: 'off_duty' });
  }

  const noTechTicket = await dbService.createComplaint({
    reporter_id: student.id,
    complaint_type: 'ROOM',
    hostel: 'Pearl',
    location_detail: 'Room 110',
    category: 'Bathroom',
    priority: 'HIGH',
    description: 'Bathroom shower mixer handle broken and water cannot be shut off.',
  });

  assert(
    noTechTicket.assignedWorker === undefined,
    'No worker assigned when no matching specialized technician is available'
  );
  assert(
    noTechTicket.complaint.status === 'PENDING_ASSIGNMENT' || noTechTicket.complaint.status === 'UNASSIGNED',
    'Complaint status set to PENDING_ASSIGNMENT (not assigned to unrelated technician)'
  );

  // Restore plumbing worker availability
  for (const pw of plumbWorkers) {
    await dbService.updateWorkerStatus(pw.id, { availability_status: 'available' });
  }

  // Domain 8: Admin Manual Assignment Validation & Override Enforcement
  console.log('\n[Domain 8] Admin Assignment Validation & Authorized Override');
  let blockedMismatch = false;
  try {
    // Attempt to manually reassign an electrical ticket to a plumbing worker without override
    await dbService.adminReassignJob({
      adminProfileId: admin.id,
      complaintId: elecTicketRes.complaint.id,
      newWorkerId: plumbingWorker.id,
      reassignReason: 'Attempting invalid cross-specialization assignment',
      allowOverride: false,
    });
  } catch (err: any) {
    blockedMismatch = true;
    assert(
      err.message.includes('specializes in'),
      'Cross-specialization assignment rejected with informative validation error'
    );
  }
  assert(blockedMismatch, 'Backend strictly blocked assigning Electrical complaint to Plumber');

  // Now attempt with authorized override
  const overrideRes = await dbService.adminReassignJob({
    adminProfileId: admin.id,
    complaintId: elecTicketRes.complaint.id,
    newWorkerId: plumbingWorker.id,
    reassignReason: 'Emergency on-site coverage: technician authorized by head warden',
    allowOverride: true,
  });

  assert(
    overrideRes.active_assignment?.is_override === true,
    'Authorized override accepted and marked in assignment record'
  );
  assert(
    overrideRes.active_assignment?.worker_id === plumbingWorker.id,
    'Complaint reassigned under authorized override'
  );

  // Domain 9: Reassignment Workflow & History Preservation
  console.log('\n[Domain 9] Reassignment Workload & History Audit');
  const assignmentHist = overrideRes.active_assignment?.reassignment_history;
  assert(
    Array.isArray(assignmentHist) && assignmentHist.length >= 1,
    'Reassignment history preserved across transitions'
  );

  // Domain 10: Technician Complaint Visibility Isolation
  console.log('\n[Domain 10] Technician Complaint Visibility Isolation');
  // Re-assign electrical ticket back to electrical technician
  await dbService.adminReassignJob({
    adminProfileId: admin.id,
    complaintId: elecTicketRes.complaint.id,
    newWorkerId: electricalWorker.id,
    reassignReason: 'Restoring standard electrical technician assignment',
    allowOverride: false,
  });

  const electricalWorkerComplaints = await dbService.listComplaints({
    worker_profile_id: electricalWorker.profile_id,
  });
  const plumbingWorkerComplaints = await dbService.listComplaints({
    worker_profile_id: plumbingWorker.profile_id,
  });

  const elecHasElecTicket = electricalWorkerComplaints.some(
    (c) => c.id === elecTicketRes.complaint.id
  );
  const plumbHasElecTicket = plumbingWorkerComplaints.some(
    (c) => c.id === elecTicketRes.complaint.id
  );

  assert(
    elecHasElecTicket === true,
    'Electrical technician sees electrical ticket assigned to them'
  );
  assert(
    plumbHasElecTicket === false,
    'Plumbing technician DOES NOT see electrical ticket assigned to electrical technician'
  );

  const plumbHasPlumbTicket = plumbingWorkerComplaints.some(
    (c) => c.id === plumbTicketRes.complaint.id
  );
  const elecHasPlumbTicket = electricalWorkerComplaints.some(
    (c) => c.id === plumbTicketRes.complaint.id
  );

  assert(
    plumbHasPlumbTicket === true,
    'Plumbing technician sees plumbing ticket assigned to them'
  );
  assert(
    elecHasPlumbTicket === false,
    'Electrical technician DOES NOT see plumbing ticket'
  );

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
