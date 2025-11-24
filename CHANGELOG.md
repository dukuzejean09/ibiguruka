# Changelog

All notable changes to NeighborWatch Connect will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Initial Release

#### Added

- ✅ **Citizen Portal**

  - User registration and authentication
  - Anonymous reporting mode
  - Voice-to-text input for Kinyarwanda
  - GPS location capture with manual adjustment
  - Photo upload support
  - Two-way chat with police
  - Safety alerts notifications
  - Public heat map visualization

- ✅ **Police Dashboard**

  - Real-time incident monitoring
  - Interactive map with live reports
  - DBSCAN clustering visualization
  - Report filtering (category, time, location, status)
  - Broadcast alert system
  - Chat interface for citizen communication
  - Report status management

- ✅ **Admin Panel**

  - User management (view, edit, delete)
  - Role assignment (citizen, police, admin)
  - User verification and blocking
  - System statistics dashboard
  - Settings management

- ✅ **Backend Services**

  - FastAPI REST API
  - JWT authentication
  - MongoDB database integration
  - DBSCAN clustering service (runs every 10 minutes)
  - Real-time data processing

- ✅ **DevOps**

  - Docker containerization
  - Docker Compose orchestration
  - GitHub Actions CI/CD pipeline
  - Automated builds to GHCR
  - Nginx reverse proxy

- ✅ **Documentation**
  - Comprehensive README
  - Installation guide
  - Quick start guide
  - API documentation
  - Contributing guidelines

#### Security

- Bcrypt password hashing
- JWT token authentication
- Role-based access control
- CORS protection
- Input validation with Pydantic

#### Performance

- Async MongoDB operations
- Efficient DBSCAN implementation
- Optimized API responses
- Docker multi-stage builds
- Nginx static file serving

### Known Limitations

- Web-only (mobile app in future)
- English UI only (Kinyarwanda/French in future)
- No push notifications yet
- No offline mode
- Limited to Kigali pilot area

---

## [Unreleased]

### Planned Features

- Mobile app (Flutter)
- iOS support
- Multi-language UI (Kinyarwanda, French)
- Push notifications (FCM)
- Real-time WebSocket updates
- SMS reporting gateway
- Advanced analytics
- Integration with RNP dispatch system
- Offline mode support
- Voice call integration
- Emergency panic button
- Community forums
- Report history tracking
- Export reports (PDF, CSV)
- Weather integration
- Traffic updates

### Future Improvements

- Unit and integration tests
- E2E testing with Playwright
- Performance monitoring
- Error tracking (Sentry)
- Load testing
- Security audit
- Accessibility improvements (WCAG 2.1)
- SEO optimization
- Progressive Web App (PWA)

---

## Version History

### [0.9.0] - 2025-01-10 (Beta)

- Beta testing with 20+ users
- Feedback from Rwanda National Police
- Bug fixes and UI improvements

### [0.5.0] - 2024-12-20 (Alpha)

- Initial alpha release
- Core features implemented
- Internal testing

### [0.1.0] - 2024-11-15 (Prototype)

- Project inception
- Basic prototype
- Architecture design

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to help improve this project.

## Support

For questions or issues:

- GitHub Issues: https://github.com/your-username/ibiguruka/issues
- Email: support@neighborwatch.rw
