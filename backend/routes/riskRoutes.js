import express from 'express';
import { 
  getAdvisories, 
  createAdvisory, 
  getTravelers, 
  checkIn, 
  triggerSOS, 
  toggleOptIn 
} from '../controllers/riskController.js';

const router = express.Router();

// Advisory routes
router.get('/advisories', getAdvisories);
router.post('/advisories', createAdvisory);

// Traveler safety routes
router.get('/travelers', getTravelers);
router.post('/travelers/:id/checkin', checkIn);
router.post('/travelers/:id/sos', triggerSOS);
router.post('/travelers/:id/toggle-optin', toggleOptIn);

export default router;
