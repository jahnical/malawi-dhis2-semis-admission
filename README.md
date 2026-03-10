# SEMIS Admission Module

A DHIS2 platform submodule for efficient student admission and registration management. This module is part of the **SEMIS (School Education Management Information System)** and provides school administrators and teachers with comprehensive tools to manage student admissions separately from enrollment processes.

## Overview

The Admission Module handles the initial registration and admission of Tracked Entity Instances (TEIs/Students) into the education system. Unlike the enrollment module which manages student progression through academic periods, the admission module focuses on:

- **Student Registration**: Initial TEI creation and admission data capture
- **Bulk Admissions**: Batch registration of multiple students with validation
- **Admission Year Management**: Configure and filter admissions by academic year
- **Admission Status Tracking**: Monitor student admission workflows and status changes
- **School-level Operations**: Tailored for school teachers and administrators

## Key Features

### 1. **Student Registration & Data Capture**
- Create new student profiles with essential admission information
- Capture standard DHIS2 TEI attributes (name, date of birth, contact, etc.)
- Support for custom admission-specific attributes
- Real-time validation of admission data
- Duplicate detection to prevent re-admissions

### 2. **Bulk Admission Processing**
- Import and process multiple student admissions simultaneously
- Support for CSV/Excel file uploads with template validation
- Batch operations for status updates and confirmations
- Progress tracking and error reporting for bulk imports
- Rollback functionality for failed batch operations

### 3. **Admission Year Configuration**
- Dynamic admission year setup and management
- Period-based filtering (academic year, intake periods)
- Configurable admission cycles (semi-annual, quarterly, etc.)
- Historical admission year tracking and reporting

### 4. **Student Search & Filtering**
- Advanced search by student name, ID, or contact details
- Filter by admission year, school, status, or custom attributes
- Quick access to recent admissions
- Export filtered student lists

### 5. **Workflow & Status Management**
- Configurable admission status workflow (Pending → Verified → Admitted)
- Approval chains for school administrators
- Status change logs and audit trails
- Automated notifications for status updates

### 6. **Admission Analytics & Reporting**
- Dashboard showing admission statistics (total, by year, by status)
- Reports on admission trends and patterns
- Demographic analysis of admitted students
- Export capabilities for further analysis

### 7. **Integration Features**
- DHIS2 Program integration for admission data
- API endpoints for external system integration
- Webhook support for real-time updates
- Data synchronization with enrollment module

### 8. **User Management & Permissions**
- Role-based access control (School Admin, Teacher, District Officer)
- Granular permissions for admission operations
- Activity logging and audit trails
- Multi-user collaboration support

## Architecture Overview

```
malawi-dhis2-semis-admission/
├── docs/                          # Documentation files
│   ├── ARCHITECTURE.md           # Technical architecture
│   ├── API.md                    # API documentation
│   └── USER_GUIDE.md             # End-user guide
├── src/
│   ├── components/               # React components
│   │   ├── AdmissionForm/        # Student admission form
│   │   ├── BulkImport/           # Bulk upload component
│   │   ├── AdmissionList/        # Student list view
│   │   ├── Dashboard/            # Admission dashboard
│   │   └── Settings/             # Module configuration
│   ├── services/                 # Business logic & API calls
│   │   ├── admissionService.js   # Admission operations
│   │   ├── bulkImportService.js  # Bulk processing
│   │   ├── dhis2Service.js       # DHIS2 integration
│   │   └── reportService.js      # Reporting
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   │   ├── validation.js         # Data validation
│   │   ├── formatters.js         # Data formatting
│   │   └── constants.js          # App constants
│   ├── store/                    # State management (Redux/Context)
│   ├── pages/                    # Page components
│   └── App.js                    # Main app component
├── tests/                        # Unit & integration tests
├── public/                       # Static assets
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## Technology Stack

- **Frontend**: React 18+, Redux/Context API for state management
- **Backend**: DHIS2 API (v2.36+)
- **UI Framework**: Material-UI or D2 UI components (DHIS2 standard)
- **HTTP Client**: Axios with interceptors
- **Form Validation**: Formik + Yup
- **Testing**: Jest + React Testing Library
- **Build Tool**: Create React App or Vite
- **Version Control**: Git (semantic versioning)

## Prerequisites

- DHIS2 v2.36 or higher
- Node.js v14+ and npm v6+
- Access to DHIS2 API with admin privileges for initial setup
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/jahnical/malawi-dhis2-semis-admission.git
cd malawi-dhis2-semis-admission
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

Update `.env` with your DHIS2 instance details:
```
REACT_APP_DHIS2_URL=https://your-dhis2-instance.com
REACT_APP_DHIS2_USERNAME=your_username
REACT_APP_DHIS2_PASSWORD=your_password
```

### 4. Start Development Server
```bash
npm start
```

The module will be available at `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
```

## Deployment

### As a DHIS2 App
1. Build the application: `npm run build`
2. Compress the `build/` directory as `admission.zip`
3. Upload via DHIS2 App Management UI
4. Configure app in DHIS2 settings

### Docker Deployment
```bash
docker build -t semis-admission .
docker run -p 3000:3000 -e REACT_APP_DHIS2_URL=<url> semis-admission
```

## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup and scaffolding
- [ ] DHIS2 integration layer
- [ ] Basic student registration form
- [ ] API service layer development

### Phase 2: Core Features (Weeks 3-4)
- [ ] Student list view with search/filter
- [ ] Admission dashboard and statistics
- [ ] Admission year configuration
- [ ] Status workflow implementation

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Bulk import with CSV/Excel support
- [ ] Advanced reporting and exports
- [ ] Approval workflow and notifications
- [ ] Integration with enrollment module

### Phase 4: Testing & Documentation (Weeks 7-8)
- [ ] Unit and integration tests (>80% coverage)
- [ ] User documentation and guides
- [ ] API documentation
- [ ] Performance optimization

### Phase 5: Deployment & Training (Week 9)
- [ ] Production deployment and CI/CD setup
- [ ] User training materials
- [ ] Support documentation
- [ ] Go-live monitoring

## API Endpoints

### Admission Management
- `GET /api/admissions` - List all admissions
- `POST /api/admissions` - Create new admission
- `GET /api/admissions/{id}` - Get admission details
- `PUT /api/admissions/{id}` - Update admission
- `DELETE /api/admissions/{id}` - Delete admission

### Bulk Operations
- `POST /api/admissions/bulk/import` - Bulk import students
- `GET /api/admissions/bulk/status/{jobId}` - Check import status
- `POST /api/admissions/bulk/validate` - Validate before import

### Reporting
- `GET /api/analytics/admissions/summary` - Summary statistics
- `GET /api/analytics/admissions/trends` - Admission trends
- `GET /api/analytics/admissions/demographics` - Demographic analysis

### Configuration
- `GET /api/config/admission-years` - List admission years
- `POST /api/config/admission-years` - Create admission year
- `PUT /api/config/admission-years/{id}` - Update admission year
- `GET /api/config/statuses` - Get admission statuses
- `GET /api/config/attributes` - Get admission attributes

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **School Admin** | Full admission management, bulk operations, approvals |
| **Teacher** | View admissions, create student registrations, limited updates |
| **District Officer** | View/report on admissions across schools, analytics |
| **System Admin** | Configuration, user management, system maintenance |

## Configuration Options

The module supports the following configurable features:

1. **Admission Statuses**: Define custom admission status workflows
2. **Required Attributes**: Set mandatory student data fields
3. **Validation Rules**: Configure admission eligibility criteria
4. **Notification Templates**: Customize status change notifications
5. **Report Templates**: Design custom admission reports
6. **Import Settings**: Configure CSV/Excel import formats and validations

## Data Validation

The module implements comprehensive validation:

- **Format Validation**: Email, phone, date formats
- **Business Logic**: Age eligibility, duplicate prevention
- **Referential Integrity**: School and program existence
- **Custom Rules**: Configurable validation rules per school
- **Error Reporting**: Detailed error messages for failed validations

## Testing

Run tests with the following commands:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test AdmissionForm

# Watch mode for development
npm test -- --watch
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/admission-feature`
3. Commit changes: `git commit -am 'Add new admission feature'`
4. Push to branch: `git push origin feature/admission-feature`
5. Submit a pull request

## Code Standards

- **ESLint**: Follow configured linting rules
- **Prettier**: Auto-format code
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: Document complex logic and public APIs
- **Tests**: Write tests for all new features

## Troubleshooting

### Common Issues

**Q: "DHIS2 connection failed"**
- A: Verify DHIS2 URL and credentials in `.env`
- Check network connectivity to DHIS2 instance
- Ensure API user has required permissions

**Q: "Bulk import fails for some records"**
- A: Check data format matches template
- Review error logs for specific validation failures
- Verify all required fields are populated

**Q: "Admission form not loading"**
- A: Clear browser cache and reload
- Check browser console for JavaScript errors
- Verify DHIS2 API is responsive

## Performance Optimization

- Implements data pagination for large lists
- Lazy loading of components and data
- Indexing for fast search operations
- Caching strategies for frequently accessed data
- Optimized API queries with field filtering

## Security Considerations

- HTTPS-only connections to DHIS2
- Input validation and output encoding to prevent injection attacks
- CSRF tokens for state-changing operations
- User session management and timeouts
- Audit logging of all admission modifications
- Role-based access control enforcement

## Support & Resources

- 📧 Email: support@semis.malawi
- 🐛 Issue Tracker: [GitHub Issues](https://github.com/jahnical/malawi-dhis2-semis-admission/issues)
- 📚 Documentation: [DHIS2 Documentation](https://docs.dhis2.org/)
- 💬 Community: [DHIS2 Community](https://community.dhis2.org/)

## License

This project is licensed under the [BSD 3-Clause License](LICENSE) - see the LICENSE file for details.

## Related Projects

- [SEMIS Enrollment Module](https://github.com/jahnical/malawi-dhis2-semis-enrollment)
- [SEMIS Core](https://github.com/jahnical/malawi-dhis2-semis)
- [DHIS2 Platform](https://github.com/dhis2/dhis2-core)

## Acknowledgments

- DHIS2 Community for platform and best practices
- Malawi Ministry of Education for requirements and feedback
- Development team and contributors

---

**Last Updated**: March 2026
**Version**: 1.0.0
**Status**: In Development
