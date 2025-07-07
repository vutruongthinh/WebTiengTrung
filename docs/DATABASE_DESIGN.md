# Database Design Documentation
## Chinese Educational Website Database Schema

### Overview
This database design supports a Chinese educational platform targeting Vietnamese learners, with features for course management, user authentication, payment processing, and progress tracking.

### Architecture Approach
- **Relational Database**: PostgreSQL with Sequelize ORM
- **Data Types**: Uses UUIDs for primary keys to support distributed scaling
- **Indexes**: Strategic indexing for query performance
- **Business Logic**: Mixed between database constraints and application logic
- **Localization**: Vietnamese-first with Chinese content support

---

## Core Entities

### 1. Users Table
**Purpose**: Manages user accounts, authentication, and membership tiers

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    membership_tier ENUM('free', 'vip') DEFAULT 'free',
    membership_expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR NULL,
    password_reset_token VARCHAR NULL,
    password_reset_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    profile_image VARCHAR NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features**:
- ✅ **Simplified Authentication**: Email/password only (phone removed for simplicity)
- ✅ **Email Verification**: Built-in token-based verification system
- ✅ **Password Reset**: Secure token-based password recovery
- ✅ **Membership Tiers**: Free and VIP with expiration tracking
- ✅ **Security**: Bcrypt password hashing with salt rounds = 12

**Business Logic**:
- `hasMembershipAccess(requiredTier)`: Checks if user has valid membership
- `comparePassword()`: Secure password verification
- `toSafeObject()`: Removes sensitive data for API responses

### 2. Courses Table
**Purpose**: Manages course content, pricing, and access requirements

```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    title_chinese VARCHAR NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500) NULL,
    level ENUM('beginner', 'intermediate', 'advanced', 'specialized', 'exam', 'online') NOT NULL,
    hsk_level VARCHAR NULL, -- 'HSK 1-2', 'HSK 3-4', etc.
    required_tier ENUM('free', 'vip') DEFAULT 'free',
    price_vnd INTEGER NOT NULL DEFAULT 0,
    vip_price_vnd INTEGER NULL, -- Set by admin for VIP membership pricing
    can_purchase_individually BOOLEAN DEFAULT true,
    duration_weeks INTEGER NULL,
    sessions_per_week INTEGER NULL,
    max_students INTEGER DEFAULT 4,
    thumbnail_url VARCHAR NULL,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    total_videos INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    learning_outcomes JSONB NULL, -- Array of Vietnamese learning outcomes
    prerequisites TEXT NULL,
    certificate_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_tier ON courses(required_tier);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_order ON courses(order_index);
```

**Key Features**:
- ✅ **Dual Pricing Model**: Individual purchase + VIP membership options
- ✅ **Vietnamese Currency**: All prices in VND (Vietnamese Dong)
- ✅ **HSK Level Mapping**: Aligned with Chinese proficiency standards
- ✅ **Flexible Access Control**: Free, purchasable, or VIP-only courses
- ✅ **Rich Metadata**: Learning outcomes, prerequisites, certificates

**Business Logic**:
- `getPurchaseOptions()`: Returns available purchase methods for a course
- `canUserAccess(user)`: Determines if user can access course content
- `getFormattedPrice()`: Vietnamese currency formatting

### 3. Videos Table
**Purpose**: Manages individual video content within courses

```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id),
    title VARCHAR NOT NULL,
    description TEXT NULL,
    video_url VARCHAR NOT NULL, -- Azure Blob Storage URL
    thumbnail_url VARCHAR NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_preview BOOLEAN DEFAULT false, -- Free preview videos
    transcript TEXT NULL, -- Vietnamese transcript
    resources JSONB NULL, -- Additional PDFs, materials
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_videos_course ON videos(course_id);
CREATE INDEX idx_videos_order ON videos(order_index);
CREATE INDEX idx_videos_preview ON videos(is_preview);
```

**Key Features**:
- ✅ **Azure Integration**: Designed for Azure Blob Storage video hosting
- ✅ **Preview System**: Some videos accessible without purchase
- ✅ **Vietnamese Transcripts**: Full transcript support for accessibility
- ✅ **Additional Resources**: JSONB for flexible material attachments
- ✅ **Ordered Content**: Sequential video progression

**Business Logic**:
- `canUserAccess(user, course)`: Checks if user can watch this specific video
- `getFormattedDuration()`: Human-readable duration formatting

### 4. Payments Table
**Purpose**: Tracks all financial transactions and payment processing

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NULL REFERENCES courses(id), -- NULL for membership purchases
    payment_type ENUM('course', 'membership') NOT NULL,
    membership_tier ENUM('vip') NULL, -- Only VIP for membership payments
    amount_vnd INTEGER NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method ENUM('vietqr', 'bank_transfer', 'cash') DEFAULT 'vietqr',
    qr_code_data TEXT NULL, -- VietQR code data
    transaction_id VARCHAR NULL, -- Bank transaction ID
    bank_reference VARCHAR NULL,
    payment_date TIMESTAMP NULL,
    expires_at TIMESTAMP NULL, -- QR code expiration
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
```

**Key Features**:
- ✅ **VietQR Integration**: Ready for Vietnamese QR code payment system
- ✅ **Dual Payment Types**: Individual courses or VIP membership
- ✅ **Transaction Tracking**: Full audit trail with bank references
- ✅ **Expirable QR Codes**: Time-limited payment windows
- ✅ **Refund Support**: 7-day refund policy built-in

**Business Logic**:
- `getFormattedAmount()`: Vietnamese currency formatting
- `isExpired()`: Checks QR code validity
- `canRefund()`: 7-day refund window validation

### 5. UserCourse Table (Junction Table)
**Purpose**: Tracks user enrollment, progress, and course relationships

```sql
CREATE TABLE user_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    payment_id UUID NULL REFERENCES payments(id),
    access_type ENUM('purchased', 'vip_membership', 'gift', 'trial') NOT NULL,
    purchased_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NULL, -- For time-limited access
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_watched_video_id UUID NULL REFERENCES videos(id),
    completion_date TIMESTAMP NULL,
    certificate_issued BOOLEAN DEFAULT false,
    rating INTEGER NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_user_courses_course ON user_courses(course_id);
CREATE UNIQUE INDEX idx_user_courses_unique ON user_courses(user_id, course_id);
```

**Key Features**:
- ✅ **Progress Tracking**: Percentage-based completion tracking
- ✅ **Multiple Access Types**: Purchase, VIP, gifts, trials
- ✅ **Resume Functionality**: Last watched video tracking
- ✅ **Course Reviews**: 5-star rating and text reviews
- ✅ **Certificate Management**: Digital certificate issuance

**Business Logic**:
- `hasAccess()`: Validates current access rights
- `isCompleted()`: Checks if course is finished
- `updateProgress()`: Automatic completion date setting

---

## Relationships & Associations

### Primary Relationships
```
Users (1) ←→ (N) Payments
Users (1) ←→ (N) UserCourses  
Courses (1) ←→ (N) Videos
Courses (1) ←→ (N) Payments
Courses (1) ←→ (N) UserCourses
Payments (1) ←→ (N) UserCourses
Videos (1) ←→ (N) UserCourses (last_watched_video)
```

### Many-to-Many Relationships
```
Users ←→ Courses (through UserCourses)
- Allows multiple enrollment types per user-course pair
- Tracks individual progress and access rights
```

### Business Rules Enforced by Schema

1. **Course Access Logic**:
   - Free courses: Accessible to all users
   - VIP courses: Require active VIP membership OR individual purchase
   - Preview videos: Always accessible regardless of enrollment

2. **Payment Processing**:
   - Course payments: Must specify course_id
   - Membership payments: course_id is NULL, must specify membership_tier
   - QR codes expire after set time period

3. **Membership Management**:
   - VIP membership has expiration date
   - Expired VIP users lose access to VIP-only content
   - Individual course purchases never expire

4. **Progress Tracking**:
   - Progress percentage (0-100%)
   - Automatic completion date when reaching 100%
   - Last watched video for resume functionality

---

## Data Integrity & Constraints

### Database-Level Constraints
- ✅ **Foreign Key Relationships**: Proper referential integrity
- ✅ **Unique Constraints**: Prevent duplicate enrollments
- ✅ **Check Constraints**: Valid percentage and rating ranges
- ✅ **Enum Values**: Restricted to valid business values

### Application-Level Validations
- ✅ **Email Format**: Valid email address validation
- ✅ **Password Strength**: Minimum 6 characters
- ✅ **Name Validation**: 2-100 character range
- ✅ **Price Validation**: Non-negative integers only

### Security Measures
- ✅ **Password Hashing**: Bcrypt with salt rounds = 12
- ✅ **Token Expiration**: Email verification and password reset tokens expire
- ✅ **Soft Deletes**: is_active flags instead of hard deletes
- ✅ **Data Sanitization**: Sensitive data removal in API responses

---

## Performance Optimizations

### Indexing Strategy
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_membership ON users(membership_tier);

-- Course filtering
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_tier ON courses(required_tier);
CREATE INDEX idx_courses_active ON courses(is_active);

-- Video streaming
CREATE INDEX idx_videos_course ON videos(course_id);
CREATE INDEX idx_videos_order ON videos(order_index);

-- Payment processing
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- Progress tracking
CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_user_courses_course ON user_courses(course_id);
```

### Query Optimization Considerations
- ✅ **Composite Indexes**: For common filter combinations
- ✅ **Partial Indexes**: On active records only where applicable
- ✅ **JSONB Indexes**: For learning_outcomes and resources fields
- ✅ **Pagination Support**: Order by indexes for large result sets

---

## Vietnamese Localization

### Language-Specific Features
- ✅ **Vietnamese Currency**: All prices in VND with proper formatting
- ✅ **Vietnamese Content**: Course descriptions, learning outcomes
- ✅ **Vietnamese Transcripts**: Video accessibility in native language
- ✅ **Bilingual Support**: Course titles in both Vietnamese and Chinese

### Cultural Considerations
- ✅ **HSK Level Integration**: Aligned with Chinese proficiency standards
- ✅ **Small Class Sizes**: max_students = 4 (typical for language learning)
- ✅ **Certificate Focus**: Important for Vietnamese educational culture

---

## Scaling Considerations

### Current Architecture Benefits
- ✅ **UUID Primary Keys**: Support for distributed systems
- ✅ **Stateless Design**: Horizontal scaling friendly
- ✅ **Clear Separation**: Business logic in application layer
- ✅ **JSONB Fields**: Flexible schema evolution

### Future Scaling Options
1. **Read Replicas**: For course content and video metadata
2. **Caching Layer**: Redis for session and course data
3. **CDN Integration**: Azure CDN for video delivery
4. **Microservices Split**: Separate payment and content services
5. **Event Sourcing**: For audit trails and analytics

### Monitoring Requirements
- ✅ **Payment Success Rates**: Critical business metric
- ✅ **Video Streaming Performance**: User experience impact
- ✅ **Course Completion Rates**: Educational effectiveness
- ✅ **User Engagement**: Progress tracking analytics

---

## Business Intelligence Support

### Analytics-Ready Schema
- ✅ **Timestamp Tracking**: All entities have created_at/updated_at
- ✅ **Progress Metrics**: Detailed completion and engagement data
- ✅ **Revenue Tracking**: Complete payment and enrollment history
- ✅ **User Behavior**: Last login, last watched video tracking

### Reporting Capabilities
1. **Revenue Reports**: By course, tier, time period
2. **Course Performance**: Completion rates, ratings, reviews
3. **User Engagement**: Login frequency, progress rates
4. **Payment Analysis**: Success rates, refund patterns

---

## Conclusion

This database design provides a solid foundation for a Vietnamese-focused Chinese educational platform with:

- **Simple but Effective**: Clean schema focused on core business needs
- **Payment-Ready**: Full VietQR integration support
- **Scalable**: UUID-based design with performance optimizations
- **Localized**: Vietnamese-first with Chinese language support
- **Business-Focused**: Tracks all key metrics for educational success

The schema balances simplicity with functionality, avoiding over-engineering while providing all necessary features for launch and initial growth phases.
