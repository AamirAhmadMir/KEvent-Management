const Company = require('../models/Company');
const User = require('../models/User');

/**
 * Company Controller
 * Handles company management operations
 */

// Create a new company
const createCompany = async (req, res) => {
    try {
        const { name, emailDomain, companyKey, maxAdmins, contactEmail, description } = req.body;
        
        // Validate required fields
        if (!name || !emailDomain || !companyKey || !contactEmail) {
            return res.status(400).json({
                success: false,
                message: 'Name, email domain, company key, and contact email are required'
            });
        }
        
        // Check if company with this domain already exists
        const existingCompany = await Company.findOne({ emailDomain });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'A company with this email domain already exists'
            });
        }
        
        // Check if company key is already taken
        const existingKey = await Company.findOne({ companyKey });
        if (existingKey) {
            return res.status(400).json({
                success: false,
                message: 'This company key is already in use'
            });
        }
        
        // Create new company
        const newCompany = new Company({
            name,
            emailDomain,
            companyKey,
            maxAdmins: maxAdmins || 10,
            contactEmail,
            description
        });
        
        await newCompany.save();
        
        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: {
                company: {
                    id: newCompany._id,
                    name: newCompany.name,
                    emailDomain: newCompany.emailDomain,
                    companyKey: newCompany.companyKey,
                    maxAdmins: newCompany.maxAdmins,
                    currentAdminCount: newCompany.currentAdminCount,
                    contactEmail: newCompany.contactEmail,
                    description: newCompany.description,
                    isActive: newCompany.isActive
                }
            }
        });
        
    } catch (error) {
        console.error('Company creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating company'
        });
    }
};

// Get all companies
const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find({ isActive: true })
            .select('name emailDomain companyKey maxAdmins currentAdminCount contactEmail description isActive createdAt')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Companies retrieved successfully',
            data: {
                companies
            }
        });
        
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching companies'
        });
    }
};

// Get company by ID
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const company = await Company.findById(id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Company retrieved successfully',
            data: {
                company
            }
        });
        
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company'
        });
    }
};

// Update company
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const company = await Company.findById(id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        // Don't allow updating email domain or company key if they exist
        if (updates.emailDomain && updates.emailDomain !== company.emailDomain) {
            const existingCompany = await Company.findOne({ emailDomain: updates.emailDomain });
            if (existingCompany) {
                return res.status(400).json({
                    success: false,
                    message: 'A company with this email domain already exists'
                });
            }
        }
        
        if (updates.companyKey && updates.companyKey !== company.companyKey) {
            const existingKey = await Company.findOne({ companyKey: updates.companyKey });
            if (existingKey) {
                return res.status(400).json({
                    success: false,
                    message: 'This company key is already in use'
                });
            }
        }
        
        // Update company
        Object.assign(company, updates);
        await company.save();
        
        res.status(200).json({
            success: true,
            message: 'Company updated successfully',
            data: {
                company
            }
        });
        
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating company'
        });
    }
};

// Delete company (soft delete - set isActive to false)
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        
        const company = await Company.findById(id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        // Check if company has active admins
        if (company.currentAdminCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete company with active admins. Please remove all admins first.'
            });
        }
        
        // Soft delete company
        company.isActive = false;
        await company.save();
        
        res.status(200).json({
            success: true,
            message: 'Company deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting company'
        });
    }
};

// Get company statistics
const getCompanyStats = async (req, res) => {
    try {
        const stats = await Company.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalCompanies: { $sum: 1 },
                    totalAdmins: { $sum: '$currentAdminCount' },
                    avgAdminsPerCompany: { $avg: '$currentAdminCount' },
                    maxAdminSlots: { $sum: '$maxAdmins' }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalCompanies: 0,
            totalAdmins: 0,
            avgAdminsPerCompany: 0,
            maxAdminSlots: 0
        };
        
        res.status(200).json({
            success: true,
            message: 'Company statistics retrieved successfully',
            data: {
                stats: result
            }
        });
        
    } catch (error) {
        console.error('Error fetching company stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching company statistics'
        });
    }
};

module.exports = {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
    getCompanyStats
};
