const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
    getCompanyStats
} = require('../controllers/companyController');

router.use(authenticateToken, requireAdmin);

router.post('/', createCompany);
router.get('/', getAllCompanies);
router.get('/stats', getCompanyStats);
router.get('/:id', getCompanyById);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

module.exports = router;
