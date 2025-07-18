from flask import Flask, request, jsonify, Response, make_response, send_file, Blueprint, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
from werkzeug.utils import secure_filename
import json
import click
from flask.cli import with_appcontext
from datetime import datetime, timedelta
from sqlalchemy import func
from dotenv import load_dotenv
import os
from flask_jwt_extended import (
    JWTManager, 
    jwt_required, 
    create_access_token, 
    get_jwt_identity,
)
from sqlalchemy.exc import SQLAlchemyError
from flask_mail import Mail, Message
import random
import requests
import logging
import string
import time
from iStokvel.utils.email_utils import send_verification_email
from flask_migrate import Migrate
from twilio.rest import Client
import phonenumbers
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from sqlalchemy import event
from sqlalchemy.engine import Engine
from jwt import ExpiredSignatureError, InvalidTokenError
import uuid
from sklearn.ensemble import RandomForestClassifier
import joblib
import pandas as pd
from PyPDF2 import PdfReader
import re
import secrets
import pyotp
import cv2
import numpy as np
import openai
import jwt as pyjwt
from sqlalchemy import select
from flask_socketio import SocketIO, emit
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from sqlalchemy import not_

# -------------------- CONFIGURATION --------------------
# Load environment variables from .env file
load_dotenv()

# Config
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT')) if os.getenv('MAIL_PORT') else None
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['SENDGRID_API_KEY'] = os.getenv('SENDGRID_API_KEY')
app.config['SENDGRID_FROM_EMAIL'] = os.getenv('SENDGRID_FROM_EMAIL')
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Add JWT configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Token expires in 1 hour
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Transaction limits
app.config['DAILY_DEPOSIT_LIMIT'] = 10000.00  # R10,000 daily limit
app.config['DAILY_TRANSFER_LIMIT'] = 5000.00   # R5,000 daily limit
app.config['MIN_TRANSACTION_AMOUNT'] = 1.00    # R1 minimum
app.config['MAX_TRANSACTION_AMOUNT'] = 50000.00 # R50,000 maximum

# Withdrawal constants
WITHDRAWAL_FEE_PERCENTAGE = 0.02  # 2% fee
MIN_WITHDRAWAL_AMOUNT = 10.00     # R10 minimum
MAX_WITHDRAWAL_AMOUNT = 50000.00  # R50,000 maximum

app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads/claims')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB upload limit
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'jpg', 'jpeg', 'png'}
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'profile_pics')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# -------------------- EXTENSIONS --------------------
db = SQLAlchemy(app)
mail = Mail(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# -------------------- LOGGING --------------------
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# -------------------- CORS --------------------
CORS(app, origins="http://localhost:5173", supports_credentials=True)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
CORS(app, resources={r"/admin/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# -------------------- UTILITY FUNCTIONS --------------------
def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_sms(phone_number, otp_code):
    """Send verification SMS with OTP"""
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_number = os.getenv('TWILIO_PHONE_NUMBER')
    if not all([account_sid, auth_token, from_number]):
        print("Twilio credentials are not set in environment variables.")
        return False, "Twilio credentials missing"
    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"Your iStokvel verification code is: {otp_code}",
            from_=from_number,
            to=phone_number
        )
        print(f"Sent SMS to {phone_number}: {message.sid}")
        return True, "SMS sent"
    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return False, str(e)

def generate_group_code(length=6):
    """Generate a random alphanumeric group code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def normalize_phone(phone):
    # Remove spaces, dashes, etc.
    phone = phone.replace(' ', '').replace('-', '')
    # Convert +27... to 0... for lookup if your DB uses 0...
    if phone.startswith('+27'):
        phone = '0' + phone[3:]
    return phone

def generate_account_number():
    """Generate a unique 10-digit account number"""
    while True:
        # Generate exactly 10 digits (1000000000 to 9999999999)
        account_num = str(random.randint(1000000000, 9999999999))
        # Check if it's unique
        if not User.query.filter_by(account_number=account_num).first():
            return account_num

def get_or_create_wallet(user_id):
    """Get existing wallet or create new one for user"""
    wallet = Wallet.query.filter_by(user_id=user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0.00)
        db.session.add(wallet)
        db.session.commit()
    return wallet

def generate_transaction_reference():
    """Generate unique transaction reference"""
    return f"TXN{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"

def validate_test_card(card_number, expiry, cvv):
    """Validate test card details - for development only"""
    # Test card validation rules
    card_number = card_number.replace(' ', '').replace('-', '')
    
    # Test card numbers (these are common test numbers)
    test_cards = {
        'visa': '4242424242424242',
        'mastercard': '5555555555554444',
        'amex': '378282246310005'
    }
    
    # Check if it's a known test card
    for card_type, test_number in test_cards.items():
        if card_number == test_number:
            return True, card_type
    
    # For development, accept any card number that looks valid
    if len(card_number) >= 13 and len(card_number) <= 19:
        card_type = Card.detect_card_type(card_number)
        return True, card_type
    
    return False, 'unknown'

def process_deposit(user_id, amount, card_id, description=""):
    """Process a deposit transaction"""
    try:
        # Get or create wallet
        wallet = get_or_create_wallet(user_id)
        
        # Get card details
        card = Card.query.get(card_id)
        if not card:
            raise ValueError("Card not found")
        
        # For development, simulate payment processing
        # In production, you would integrate with a real payment processor
        payment_successful = simulate_payment_processing(amount, card)
        
        if not payment_successful:
            raise ValueError("Payment processing failed")
        
        # Create transaction record
        transaction = Transaction(
            user_id=user_id,
            transaction_type='deposit',
            amount=amount,
            fee=0.00,  # No fee for deposits
            net_amount=amount,  # Full amount for deposits
            status='completed',
            reference=generate_transaction_reference(),
            description=description or f"Deposit via {card.card_type.title()} ****{card.card_number_last4}",
            card_id=card_id,
            completed_at=datetime.utcnow()
        )
        
        # Update wallet balance
        wallet.balance += amount
        
        db.session.add(transaction)
        db.session.commit()
        
        return {
            'success': True,
            'transaction': transaction.to_dict(),
            'new_balance': float(wallet.balance)
        }
    except Exception as e:
        db.session.rollback()
        raise e

def simulate_payment_processing(amount, card):
    """Simulate payment processing - for development only"""
    # In development, always succeed
    # In production, integrate with Stripe, PayGate, or other payment processor
    return True

def process_transfer(sender_id, recipient_account_number, amount, description=""):
    recipient = User.query.filter_by(account_number=recipient_account_number).first()
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404
    if sender_id == recipient.id:
        raise ValueError("Cannot transfer to yourself")
    # ... rest of logic ...

def check_transaction_limits(user_id, amount, transaction_type):
    """Check if transaction is within limits"""
    today = datetime.utcnow().date()
    
    if transaction_type == 'deposit':
        daily_total = db.session.query(func.sum(Transaction.amount))\
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'deposit',
                func.date(Transaction.created_at) == today,
                Transaction.status == 'completed'
            ).scalar() or 0.0
        
        if daily_total + amount > app.config['DAILY_DEPOSIT_LIMIT']:
            raise ValueError(f"Daily deposit limit exceeded. You can deposit R{app.config['DAILY_DEPOSIT_LIMIT'] - daily_total:.2f} more today.")
    
    elif transaction_type == 'transfer':
        daily_total = db.session.query(func.sum(Transaction.amount))\
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == 'transfer',
                func.date(Transaction.created_at) == today,
                Transaction.status == 'completed',
                Transaction.amount < 0  # Outgoing transfers
            ).scalar() or 0.0
        
        if abs(daily_total) + amount > app.config['DAILY_TRANSFER_LIMIT']:
            raise ValueError(f"Daily transfer limit exceeded. You can transfer R{app.config['DAILY_TRANSFER_LIMIT'] - abs(daily_total):.2f} more today.")
    
    # Check amount limits
    if amount < app.config['MIN_TRANSACTION_AMOUNT']:
        raise ValueError(f"Minimum transaction amount is R{app.config['MIN_TRANSACTION_AMOUNT']:.2f}")
    
    if amount > app.config['MAX_TRANSACTION_AMOUNT']:
        raise ValueError(f"Maximum transaction amount is R{app.config['MAX_TRANSACTION_AMOUNT']:.2f}")

def luhn_check(card_number):
    """Luhn algorithm to validate card number"""
    digits = [int(d) for d in card_number]
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    checksum = sum(odd_digits)
    for d in even_digits:
        checksum += sum(divmod(d * 2, 10))
    return checksum % 10 == 0

def validate_card(card_number, expiry, cvv):
    """Validate card details - accepts both test and real cards"""
    # Clean card number
    card_number = card_number.replace(' ', '').replace('-', '')
    
    # Basic validation
    if len(card_number) < 13 or len(card_number) > 19:
        return False, 'invalid_length'
    
    # Luhn algorithm check for valid card number
    # if not luhn_check(card_number):
    #     return False, 'invalid_number'
    
    # Validate expiry date
    try:
        month, year = expiry.split('/')
        month, year = int(month), int(year)
        if month < 1 or month > 12:
            return False, 'invalid_expiry'
        
        # Check if card is expired
        current_year = datetime.utcnow().year % 100
        current_month = datetime.utcnow().month
        if year < current_year or (year == current_year and month < current_month):
            return False, 'expired'
    except:
        return False, 'invalid_expiry_format'
    
    # Validate CVV
    if len(cvv) < 3 or len(cvv) > 4:
        return False, 'invalid_cvv'
    
    # Detect card type
    card_type = Card.detect_card_type(card_number)
    
    return True, card_type

def check_email_config():
    """Check if email configuration is properly set up"""
    required_vars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"WARNING: Missing email configuration variables: {missing_vars}")
        print("Email functionality will not work properly!")
        return False
    
    print("Email configuration check passed!")
    return True

def audit_log(action, resource_type=None, resource_id=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Get admin info from token
                token = request.headers.get('Authorization')
                if token:
                    token = token.split(' ')[1]
                    payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                    admin_id = payload.get('user_id')
                    
                    # Create audit log
                    audit_entry = AdminAuditLog(
                        admin_id=admin_id,
                        action=action,
                        resource_type=resource_type,
                        resource_id=str(resource_id) if resource_id else None,
                        details={
                            'method': request.method,
                            'endpoint': request.endpoint,
                            'ip_address': request.remote_addr,
                            'user_agent': request.headers.get('User-Agent')
                        },
                        ip_address=request.remote_addr,
                        user_agent=request.headers.get('User-Agent')
                    )
                    db.session.add(audit_entry)
                    db.session.commit()
                
                return f(*args, **kwargs)
            except Exception as e:
                return f(*args, **kwargs)  # Continue even if audit fails
        return decorated_function
    return decorator

# -------------------- MODELS --------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='member')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile_picture = db.Column(db.String(200))
    gender = db.Column(db.String(10))
    employment_status = db.Column(db.String(100))
    is_verified = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_method = db.Column(db.String(10), default='email')  # 'email' or 'sms'
    otps = db.relationship('OTP', backref='user', lazy=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    google_id = db.Column(db.String(120), unique=True, nullable=True)
    verification_code = db.Column(db.String(6), nullable=True)
    verification_code_expiry = db.Column(db.DateTime, nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    referral_code = db.Column(db.String(8), unique=True, nullable=True, default=lambda: uuid.uuid4().hex[:8].upper())
    points = db.Column(db.Integer, default=0)
    valid_referrals = db.Column(db.Integer, default=0)
    account_number = db.Column(db.String(20), unique=True, nullable=True)
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade="all, delete-orphan")
    _table_args_ = (
        db.Index('idx_user_email', 'email'),
        db.Index('idx_user_phone', 'phone'),
    )
    

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def generate_verification(self):
        """Generate and save new verification code"""
        from iStokvel.utils.email_utils import generate_verification_code
        self.verification_code = generate_verification_code()
        self.verification_code_expiry = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        return self.verification_code
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            # add any other fields you want to expose
        }

class StokvelGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    tier = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=True)  # or nullable=True
    contribution_amount = db.Column(db.Float, nullable=False)  # <-- ADD THIS LINE
    rules = db.Column(db.String(255))
    benefits = db.Column(db.ARRAY(db.String))
    description = db.Column(db.Text)
    frequency = db.Column(db.String(50), nullable=False)
    max_members = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    group_code = db.Column(db.String(10), unique=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    members = db.relationship('StokvelMember', backref='group', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'contribution_amount': float(self.contribution_amount or 0),
            'frequency': self.frequency,
            'max_members': self.max_members,
            'member_count': len(self.members),
            'group_code': self.group_code,
            'admin_id': self.admin_id,
            'created_at': self.created_at.isoformat()
        }

class StokvelMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='active')  # active, inactive, suspended
    role = db.Column(db.String(20), default='member')  # member, admin
    user = db.relationship('User', backref='memberships')
    
class MarketTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    item_type = db.Column(db.String(50), nullable=False)  # airtime, data, electricity, voucher
    provider = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)  # wallet, card
    status = db.Column(db.String(20), default='pending')  # pending, successful, failed
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    reference = db.Column(db.String(100), unique=True)

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('stokvel_member.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, rejected
    member = db.relationship('StokvelMember', backref='contributions')

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='active')  # active, closed
    group = db.relationship('StokvelGroup', backref='polls')

class PollOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    votes = db.Column(db.Integer, default=0)
    poll = db.relationship('Poll', backref='options')

class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200))
    status = db.Column(db.String(50), default='scheduled')  # scheduled, completed, cancelled
    group = db.relationship('StokvelGroup', backref='meetings')

class WithdrawalRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('stokvel_member.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected
    approvals_needed = db.Column(db.Integer, default=2)
    approvals_received = db.Column(db.Integer, default=0)
    member = db.relationship('StokvelMember', backref='withdrawal_requests')

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    balance = db.Column(db.Float, default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='wallet')

class NotificationSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    email_announcements = db.Column(db.Boolean, default=True)
    email_stokvel_updates = db.Column(db.Boolean, default=True)
    email_marketplace_offers = db.Column(db.Boolean, default=False)
    push_announcements = db.Column(db.Boolean, default=True)
    push_stokvel_updates = db.Column(db.Boolean, default=True)
    push_marketplace_offers = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='notification_settings')


class AdminRole(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    permissions = db.Column(db.JSON, default={})
    is_system_role = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'permissions': self.permissions,
            'is_system_role': self.is_system_role,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class AdminSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    mfa_verified = db.Column(db.Boolean, default=False)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='admin_sessions')

class AdminAuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.String(50))
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    admin = db.relationship('User', backref='audit_logs')


class FAQ(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=True)
    is_published = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question,
            "answer": self.answer,
            "category": self.category,
            "is_published": self.is_published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class UserPreferences(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    language = db.Column(db.String(10), default='en')
    currency = db.Column(db.String(3), default='ZAR')
    theme = db.Column(db.String(10), default='light')
    data_for_personalization = db.Column(db.Boolean, default=True)
    data_for_analytics = db.Column(db.Boolean, default=True)
    data_for_third_parties = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='preferences')
    
class Beneficiary(db.Model):
    __tablename__ = 'beneficiary'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50))
    id_number = db.Column(db.String(20))
    date_of_birth = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # --- Add these fields ---
    id_doc_url = db.Column(db.String(255))
    address_doc_url = db.Column(db.String(255))
    relationship_doc_url = db.Column(db.String(255))
    # ------------------------
    user = db.relationship('User', backref='beneficiaries')
    status = db.Column(db.String(20), default="No Documents")

class CustomerConcern(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "subject": self.subject,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='general')  # kyc_required, approved, rejected, etc.
    data = db.Column(db.JSON)  # Additional data like group_id, join_request_id
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')

class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    is_used = db.Column(db.Boolean, default=False)

    def is_valid(self):
        return datetime.utcnow() < self.expires_at and not self.is_used

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(200))
    is_stokvel_related = db.Column(db.Boolean, default=False)
    stokvel_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user', 'assistant'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

class KYCVerification(db.Model):
    __tablename__ = 'kyc_verification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    full_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    id_number = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    employment_status = db.Column(db.String(50))
    employer_name = db.Column(db.String(100))
    street_address = db.Column(db.String(200))
    city = db.Column(db.String(100))
    province = db.Column(db.String(100))
    postal_code = db.Column(db.String(10))
    country = db.Column(db.String(100))
    monthly_income = db.Column(db.Float)
    income_source = db.Column(db.String(50))
    employment_type = db.Column(db.String(50))
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(20))
    account_type = db.Column(db.String(20))
    branch_code = db.Column(db.String(10))
    id_document_path = db.Column(db.String(200))
    proof_of_address_path = db.Column(db.String(200))
    proof_of_income_path = db.Column(db.String(200))
    bank_statement_path = db.Column(db.String(200))
    verification_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    cardholder = db.Column(db.String(100), nullable=False)
    card_number_last4 = db.Column(db.String(4), nullable=False)  # Only store last 4 digits!
    expiry = db.Column(db.String(5), nullable=False)  # MM/YY
    is_primary = db.Column(db.Boolean, default=False)
    card_type = db.Column(db.String(20), default='visa')  # visa, mastercard, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('cards', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'cardholder': self.cardholder,
            'card_number': f"**** **** **** {self.card_number_last4}",
            'expiry': self.expiry,
            'is_primary': self.is_primary,
            'card_type': self.card_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def detect_card_type(card_number):
        """Detect card type based on card number"""
        card_number = card_number.replace(' ', '').replace('-', '')
        
        if card_number.startswith('4'):
            return 'visa'
        elif card_number.startswith('5'):
            return 'mastercard'
        elif card_number.startswith('3'):
            return 'amex'
        else:
            return 'unknown'

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'deposit', 'transfer', 'withdrawal'
    amount = db.Column(db.Float, nullable=False)
    fee = db.Column(db.Float, default=0.00)  # Add fee field
    net_amount = db.Column(db.Float, nullable=False)  # Add net_amount field
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    reference = db.Column(db.String(50), unique=True)
    description = db.Column(db.String(200))
    recipient_email = db.Column(db.String(120))  # For transfers
    sender_email = db.Column(db.String(120))     # For transfers
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'))  # For deposits
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='transactions')
    card = db.relationship('Card', backref='transactions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': float(self.amount),
            'fee': float(self.fee or 0.0),
            'net_amount': float(self.net_amount or self.amount),
            'transaction_type': self.transaction_type,
            'status': self.status,
            'reference': self.reference,
            'description': self.description,
            'recipient_email': self.recipient_email,
            'sender_email': self.sender_email,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class GroupJoinRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'))  # <-- Add this
    category = db.Column(db.String(64))
    tier = db.Column(db.String(64))
    amount = db.Column(db.Integer)
    status = db.Column(db.String(20), default="Pending")
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime)
    user = db.relationship('User', backref='join_requests')
    group = db.relationship('StokvelGroup', backref='join_requests')  # <-- Add this

    
class SavingsGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    label = db.Column(db.String(100), nullable=False)
    target = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='savings_goals')
    

class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    beneficiary_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending/review/approved/rejected
    reason = db.Column(db.Text)
    id_document_path = db.Column(db.String(200))
    death_certificate_path = db.Column(db.String(200))
    proof_of_residence_path = db.Column(db.String(200))
    additional_documents_path = db.Column(db.String(200))  # JSON array
    fraud_score = db.Column(db.Float)
    fraud_indicators = db.Column(db.Text)  # JSON array
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='claims')
    beneficiary = db.relationship('User', foreign_keys=[beneficiary_id])

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    referee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, verified, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint('referrer_id', 'referee_id', name='uq_referral_pair'),
    )
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals_sent')
    referee = db.relationship('User', foreign_keys=[referee_id], backref='referrals_received')

def get_user_by_referral_code(code):
    stmt = select(User).where(User.referral_code == code)
    return db.session.execute(stmt).scalar_one_or_none()

def check_and_process_referral_completion(referee_user):
    stmt = select(Referral).where(
        Referral.referee_id == referee_user.id,
        Referral.status == 'verified'
    )
    referral = db.session.execute(stmt).scalar_one_or_none()
    if not referral:
        return
    if not (referee_user.is_verified and getattr(referee_user, 'kyc_completed', True)):
        return
    if referral.status == 'completed':
        return
    referral.status = 'completed'
    referrer = db.session.get(User, referral.referrer_id)
    if not referrer:
        return
    referrer.valid_referrals += 1
    if referrer.valid_referrals == 1:
        referrer.points += 20
        unlock_notification = Notification(
            user_id=referrer.id,
            title="Referral Bonus Unlocked!",
            message="Congratulations! Your first successful referral earned you a 20 point unlock bonus. You now get points for every new referral."
        )
        db.session.add(unlock_notification)
    else:
        referrer.points += 30
        if referrer.valid_referrals > 0 and referrer.valid_referrals % 3 == 0:
            referrer.points += 100
            milestone_notification = Notification(
                user_id=referrer.id,
                title="🎉 Milestone Reached! 🎉",
                message=f"Amazing! You've reached {referrer.valid_referrals} successful referrals and earned a 100 point bonus!"
            )
            db.session.add(milestone_notification)

# -------------------- DECORATORS --------------------
def token_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # SECURITY FIX: Check if user is verified
        if not current_user.is_verified:
            return jsonify({'error': 'Please verify your email address to access this feature'}), 403
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = request.headers.get('Authorization')
            print("DEBUG: Authorization header:", token)
            if not token:
                print("DEBUG: No token provided")
                return jsonify({'error': 'No token provided'}), 401

            try:
                token = token.split(' ')[1]  # Remove 'Bearer ' prefix
                print("DEBUG: Token after split:", token)
            except Exception as e:
                print("DEBUG: Error splitting token:", repr(e))
                return jsonify({'error': 'Malformed token'}), 401

            try:
                payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                print("DEBUG: Decoded JWT payload:", payload)
            except ExpiredSignatureError:
                print("DEBUG: Token has expired")
                return jsonify({'error': 'Token has expired'}), 401
            except InvalidTokenError:
                print("DEBUG: Invalid token")
                return jsonify({'error': 'Invalid token'}), 401
            except Exception as e:
                print("DEBUG: Error decoding token:", repr(e))
                return jsonify({'error': 'Token decode error'}), 401

            user_id = payload.get('user_id') or payload.get('sub')
            print("DEBUG: User ID from payload:", user_id)
            user = User.query.get(user_id)
            print("DEBUG: User from DB:", user)

            if not user:
                print("DEBUG: User not found in DB")
                return jsonify({'error': 'User not found'}), 401

            print(f"DEBUG: User role: {user.role}, is_verified: {user.is_verified}")

            if not user.is_verified:
                print("DEBUG: User not verified")
                return jsonify({'error': 'Please verify your email address to access this feature'}), 403

            if user.role != 'admin':
                print("DEBUG: User is not admin")
                return jsonify({'error': 'Admin access required'}), 403

            print("DEBUG: Admin access granted")
            return f(*args, **kwargs)
        except Exception as e:
            print("DEBUG: Unhandled exception in admin_required:", repr(e))
            return jsonify({'error': 'Unknown error'}), 401
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                token = request.headers.get('Authorization')
                print("DEBUG: Authorization header:", token)
                if not token:
                    print("DEBUG: No token provided")
                    return jsonify({'error': 'No token provided'}), 401

                try:
                    token = token.split(' ')[1]
                    print("DEBUG: Token after split:", token)
                except Exception as e:
                    print("DEBUG: Error splitting token:", repr(e))
                    return jsonify({'error': 'Malformed token'}), 401

                try:
                    payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                    print("DEBUG: Decoded JWT payload:", payload)
                except ExpiredSignatureError:
                    print("DEBUG: Token has expired")
                    return jsonify({'error': 'Token has expired'}), 401
                except InvalidTokenError:
                    print("DEBUG: Invalid token")
                    return jsonify({'error': 'Invalid token'}), 401
                except Exception as e:
                    print("DEBUG: Error decoding token:", repr(e))
                    return jsonify({'error': 'Token decode error'}), 401

                user_id = payload.get('user_id') or payload.get('sub')
                print("DEBUG: User ID from payload:", user_id)
                user = User.query.get(user_id)
                print("DEBUG: User from DB:", user)

                if not user:
                    print("DEBUG: User not found in DB")
                    return jsonify({'error': 'User not found'}), 401

                print(f"DEBUG: User role: {user.role}, is_verified: {user.is_verified}")

                if not user.is_verified:
                    print("DEBUG: User not verified")
                    return jsonify({'error': 'Please verify your email address to access this feature'}), 403

                if user.role not in allowed_roles:
                    print("DEBUG: User does not have required role")
                    return jsonify({'error': 'Insufficient permissions'}), 403

                print("DEBUG: Role access granted")
                return f(*args, **kwargs)
            except Exception as e:
                print("DEBUG: Unhandled exception in role_required:", repr(e))
                return jsonify({'error': 'Unknown error'}), 401
        return decorated_function
    return decorator

class FraudDetector:
    def __init__(self):
        try:
            self.model = joblib.load('fraud_model.pkl')
        except:
            self.train_default_model()

    def train_default_model(self):
        """Create a simple model if none exists"""
        data = pd.DataFrame([
            {"amount": 5000, "past_claims": 1, "fraud": 0},
            {"amount": 100000, "past_claims": 5, "fraud": 1},
            {"amount": 20000, "past_claims": 0, "fraud": 0},
            {"amount": 150000, "past_claims": 3, "fraud": 1}
        ])
        X = data[["amount", "past_claims"]]
        y = data["fraud"]
        self.model = RandomForestClassifier()
        self.model.fit(X, y)
        joblib.dump(self.model, 'fraud_model.pkl')

    def predict_fraud(self, amount, past_claims):
        return self.model.predict_proba([[amount, past_claims]])[0][1]

    @staticmethod
    def rule_based_checks(claim, db):
        """Basic fraud indicators"""
        indicators = []
        
        # 1. High claim amount
        if claim.amount > 100000:
            indicators.append("High claim amount (> R100,000)")
        
        # 2. Multiple recent claims
        recent_claims = db.session.query(Claim).filter(
            Claim.user_id == claim.user_id,
            Claim.created_at >= datetime.now() - timedelta(days=30)
        ).count()
        
        if recent_claims > 3:
            indicators.append(f"Multiple recent claims ({recent_claims} in 30 days)")
        
        # 3. Suspicious beneficiary
        if claim.beneficiary_id:
            beneficiary = db.session.get(User, claim.beneficiary_id)
            if beneficiary and beneficiary.created_at >= datetime.now() - timedelta(days=7):
                indicators.append("Recently created beneficiary account")
        
        return indicators

    @staticmethod
    def check_document(file_path):
        """Detect document tampering"""
        if not file_path:
            return None
            
        if file_path.lower().endswith('.pdf'):
            try:
                with open(file_path, 'rb') as f:
                    reader = PdfReader(f)
                    text = "".join(page.extract_text() or '' for page in reader.pages)
                
                if re.search(r"(\d{2}/\d{2}/\d{4}).*?\1", text):  # Duplicate dates
                    return "Possible date tampering in document"
            except:
                return "Could not analyze PDF document"
        
        elif file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
            try:
                img = cv2.imread(file_path)
                if img is None:
                    return None
                
                edges = cv2.Canny(img, 100, 200)
                edge_ratio = np.sum(edges > 0) / (img.shape[0] * img.shape[1])
                if edge_ratio > 0.5:
                    return "Possible image manipulation"
            except:
                return "Could not analyze image document"
        
        return None


# -------------------- ROUTES --------------------

# Test routes
@app.route('/api/test', methods=['GET'])
def test():
    logger.debug('Test route accessed')
    return jsonify({"message": "Server is working!"}), 200

@app.route('/api/test-connection')
def test_connection():
    try:
        # Test database
        db.engine.connect()
        db_status = "Database: Connected"
        
        # Test email
        mail_status = "Email: Not tested"
        if app.config['MAIL_USERNAME'] and app.config['MAIL_PASSWORD']:
            mail_status = "Email: Configured"
        
        return jsonify({
            'status': 'success',
            'database': db_status,
            'email': mail_status,
            'database_url': app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres:postgres', ':')  # Hide password
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Auth routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        phone = data.get('phone')

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Create new user with account number
        user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            role='member',
            account_number=generate_account_number()  # <-- ADD THIS
        )
        user.set_password(password)

        db.session.add(user)
        db.session.flush()  # Get the user ID

        # Create wallet for the new user
        wallet = Wallet(user_id=user.id, balance=0.00)
        db.session.add(wallet)

        # --- Refer and Earn: Referral logic ---
        referral_code = data.get('referral_code') or request.args.get('ref')
        if referral_code:
            referrer = get_user_by_referral_code(referral_code)
            if referrer:
                referral = Referral(referrer_id=referrer.id, referee_id=user.id, status='pending')
                db.session.add(referral)

        db.session.commit()

        # Generate and send verification code with better error handling
        try:
            verification_code = user.generate_verification()
            print(f"Generated verification code: {verification_code} for user: {email}")
            
            success, message = send_verification_email(user.email, verification_code)
            print(f"Email sending result - Success: {success}, Message: {message}")
            
            if not success:
                print(f"Warning: Failed to send verification email: {message}")
                # Still return success but with a warning
                return jsonify({
                    'message': 'Account created successfully, but verification email failed to send. Please try resending.',
                    'email': user.email,
                    'user_id': user.id,
                    'account_number': user.account_number,  # <-- ADD THIS
                    'email_sent': False
                }), 201
            else:
                return jsonify({
                    'message': 'Registration successful. Please check your email for verification code.',
                    'email': user.email,
                    'user_id': user.id,
                    'account_number': user.account_number,  # <-- ADD THIS
                    'email_sent': True
                }), 201
                
        except Exception as email_e:
            print(f"Warning: Exception during verification email sending: {str(email_e)}")
            import traceback
            traceback.print_exc()
            # Still return success but with a warning
            return jsonify({
                'message': 'Account created successfully, but verification email failed to send. Please try resending.',
                'email': user.email,
                'user_id': user.id,
                'account_number': user.account_number,  # <-- ADD THIS
                'email_sent': False
            }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred during registration'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # SECURITY FIX: Check if user is verified before allowing login
    if not user.is_verified:
        return jsonify({'error': 'Please verify your email address before logging in'}), 401

    if user.two_factor_enabled:
        otp_code = generate_otp()
        expiry = datetime.utcnow() + timedelta(minutes=10)
        otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
        db.session.add(otp)
        db.session.commit()
        if user.two_factor_method == 'sms':
            send_verification_sms(user.phone, otp_code)
        else:
            send_verification_email(user.email, otp_code)
        return jsonify({'message': '2FA code sent', 'user_id': user.id, 'two_factor_required': True}), 200

    access_token = create_access_token(identity=str(user.id))

    user_agent = request.headers.get('User-Agent', 'Unknown')
    ip_address = request.remote_addr or 'Unknown'
    session = UserSession(
        user_id=user.id,
        user_agent=user_agent,
        ip_address=ip_address
    )
    db.session.add(session)
    db.session.commit()

    user_data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "profile_picture": user.profile_picture,
        "gender": user.gender,
        "employment_status": user.employment_status,
        "is_verified": user.is_verified,
        "two_factor_enabled": user.two_factor_enabled
    }
    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "user": user_data
    }), 200

@app.route('/api/auth/verify', methods=['POST'])
def verify_otp():
    data = request.get_json()
    phone = data.get('phone')
    otp_code = data.get('otp_code')

    if not phone or not otp_code:
        return jsonify({'success': False, 'message': 'Phone and OTP code are required'}), 400

    user = User.query.filter_by(phone=phone).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    otp = OTP.query.filter_by(user_id=user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400

    otp.is_used = True
    db.session.commit()

    # Create JWT token and return user info
    access_token = create_access_token(identity=str(user.id))
    user_data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_verified": user.is_verified
    }
    return jsonify({
        'success': True,
        'message': 'Phone verified successfully',
        'access_token': access_token,
        'user': user_data
    })

@app.route('/api/auth/verify-email', methods=['POST', 'OPTIONS'])
def verify_email():
    if request.method == 'OPTIONS':
        # Explicitly handle OPTIONS preflight request
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers'))
        response.headers.add('Access-Control-Allow-Methods', request.headers.get('Access-Control-Request-Method'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200

    # Handle the POST request
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            email = data.get('email')
            code = data.get('verification_code')
            
            if not email or not code:
                return jsonify({'error': 'Email and verification code are required'}), 400

            # Clean the verification code
            code = code.replace(' ', '')
            
            user = User.query.filter_by(email=email).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.is_verified:
                return jsonify({'error': 'Email already verified'}), 400
            
            if not user.verification_code or not user.verification_code_expiry:
                return jsonify({'error': 'No verification code found for this user'}), 400
            
            if datetime.utcnow() > user.verification_code_expiry:
                return jsonify({'error': 'Verification code expired'}), 400
            
            # Clean the stored verification code for comparison
            stored_code = user.verification_code.replace(' ', '')
            if stored_code != code:
                print(f"Code mismatch - Received: '{code}', Stored: '{stored_code}'")  # Debug log
                return jsonify({'error': 'Invalid verification code'}), 400
            
            # Mark user as verified
            user.is_verified = True
            user.verification_code = None
            user.verification_code_expiry = None

            # --- Referral Completion Logic ---
            stmt = select(Referral).where(Referral.referee_id == user.id, Referral.status == 'pending')
            pending_referral = db.session.execute(stmt).scalar_one_or_none()
            if pending_referral:
                pending_referral.status = 'verified'
            check_and_process_referral_completion(user)
            db.session.commit()
            
            return jsonify({'message': 'Email verified successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Verification error: {str(e)}")  # Debug log
            return jsonify({'error': str(e)}), 500

@app.route('/api/auth/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.is_verified:
            return jsonify({'error': 'Email already verified'}), 400
        
        # Generate and send new verification code
        verification_code = user.generate_verification()
        print(f"Resending verification code: {verification_code} for user: {email}")
        
        success, message = send_verification_email(user.email, verification_code)
        print(f"Resend email result - Success: {success}, Message: {message}")
        
        if not success:
            db.session.rollback()
            return jsonify({'error': f'Failed to send verification email: {message}'}), 500
        
        db.session.commit()

        return jsonify({'message': 'New verification code sent successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error during resend: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to resend verification code: {str(e)}'}), 500

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    # You can use pass, or a real implementation, or a placeholder return
    return jsonify({'message': 'Not implemented'}), 501

@app.route('/api/auth/resend-sms', methods=['POST'])
def resend_sms():
    data = request.get_json()
    phone = data.get('phone')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone number is required'}), 400

    normalized_phone = normalize_phone(phone)
    user = User.query.filter_by(phone=normalized_phone).first()
    if not user:
        return jsonify({'success': False, 'message': 'User with this phone does not exist'}), 404

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()

    success, message = send_verification_sms(normalized_phone, otp_code)
    if not success:
        return jsonify({'success': False, 'message': f'Failed to send SMS: {message}'}), 500

    return jsonify({'success': True, 'message': 'OTP sent successfully'})

@app.route('/api/auth/verify-2fa-login', methods=['POST'])
def verify_2fa_login():
    data = request.get_json()
    user_id = data.get('user_id')
    otp_code = data.get('otp_code')
    user = User.query.get(user_id)
    otp = OTP.query.filter_by(user_id=user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    otp.is_used = True
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'message': '2FA login successful', 'access_token': access_token}), 200

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'id': current_user.id,
        'name': current_user.full_name,
        'email': current_user.email,
        'role': current_user.role,
        'profilePicture': current_user.profile_picture
    })

@app.route("/api/auth/google", methods=["POST", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def google_login():
    if request.method == "OPTIONS":
        return '', 200
    token = request.json.get("token")
    logger.debug("Received Google token")  # Using your existing logger instead of print
    
    if not token:
        return jsonify({"error": "Missing Google token"}), 400

    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(token, grequests.Request(), GOOGLE_CLIENT_ID)
        
        # Validate that the token is for your app
        if idinfo['aud'] != GOOGLE_CLIENT_ID:
            raise ValueError("Invalid client ID")

        google_id = idinfo["sub"]
        email = idinfo.get("email")
        full_name = idinfo.get("name")
        profile_picture = idinfo.get("picture")

        # Check if user exists by email (since not all users may have google_id)
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create new user with Google auth
            user = User(
                email=email,
                full_name=full_name,
                profile_picture=profile_picture,
                is_verified=True,  # Google verified the email
                google_id=google_id
            )
            db.session.add(user)
            db.session.commit()
        elif not user.google_id:
            # Existing user without google_id - update it
            user.google_id = google_id
            if not user.profile_picture:
                user.profile_picture = profile_picture
            db.session.commit()

        # Create JWT token (using your existing JWT setup)
        access_token = create_access_token(identity=str(user.id))

        # Track the login session
        user_agent = request.headers.get('User-Agent', 'Unknown')
        ip_address = request.remote_addr or 'Unknown'
        session = UserSession(
            user_id=user.id,
            user_agent=user_agent,
            ip_address=ip_address
        )
        db.session.add(session)
        db.session.commit()

        # Return user data in the same format as your regular login
        user_data = {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "profile_picture": user.profile_picture,
            "is_verified": user.is_verified
        }
        
        return jsonify({
            "success": True,
            "message": "Google login successful",
            "access_token": access_token,
            "user": user_data
        }), 200

    except ValueError as e:
        logger.error(f"Google token validation failed: {str(e)}")
        return jsonify({"error": "Invalid Google token", "details": str(e)}), 401
    except Exception as e:
        db.session.rollback()
        logger.error(f"Google login error: {str(e)}")
        return jsonify({"error": "Server error during Google login"}), 500


#----------------------------------------------------------------- User routes
@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    try:
        # Automatically generate account number if user doesn't have one
        if not current_user.account_number:
            current_user.account_number = generate_account_number()
            db.session.commit()
            print(f"✅ Generated account number {current_user.account_number} for user {current_user.id} ({current_user.email})")
        
        # Ensure user has a wallet
        wallet = get_or_create_wallet(current_user.id)
        
        return jsonify({
            "id": current_user.id,
            "full_name": current_user.full_name,
            "name": current_user.full_name,  # <-- Add this line
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role,
            "profile_picture": current_user.profile_picture,
            "gender": current_user.gender,
            "employment_status": current_user.employment_status,
            "is_verified": current_user.is_verified,
            "two_factor_enabled": current_user.two_factor_enabled,
            "account_number": current_user.account_number,
            "wallet_balance": float(wallet.balance) if wallet.balance is not None else 0.00,
            # Add this line to always return date_of_birth as a string
            "date_of_birth": current_user.date_of_birth.strftime('%Y-%m-%d') if current_user.date_of_birth else None,
        }), 200
    except Exception as e:
        print(f"❌ Error in get_user_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Failed to load profile",
            "details": str(e)
        }), 500


@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user):
    data = request.get_json()
    if 'name' in data:
        current_user.full_name = data['name']
    if 'phone' in data:
        current_user.phone = data['phone']
    if 'gender' in data:
        current_user.gender = data['gender']
    if 'employment_status' in data:
        current_user.employment_status = data['employment_status']
    if 'date_of_birth' in data and data['date_of_birth']:
        try:
            current_user.date_of_birth = datetime.fromisoformat(data['date_of_birth'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200


@app.route('/api/user/profile-picture', methods=['POST'])
@token_required
def upload_profile_picture(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(f"{current_user.id}_{file.filename}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        # Save the relative path or URL in the database
        current_user.profile_picture = f"/uploads/profile_pics/{filename}"
        db.session.commit()
        return jsonify({'profile_picture': current_user.profile_picture}), 200

@app.route('/uploads/profile_pics/<filename>')
def serve_profile_picture(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/user/security/password', methods=['PUT', 'OPTIONS'])
@token_required
def change_password(current_user):
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_user or not current_user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400

    current_user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'})

@app.route('/api/user/security/2fa', methods=['POST', 'OPTIONS'])
@token_required
def toggle_two_factor(current_user):
    current_user.two_factor_enabled = not current_user.two_factor_enabled
    db.session.commit()
    return jsonify({
        "message": "Two-factor authentication updated",
        "two_factor_enabled": current_user.two_factor_enabled
    }), 200

@app.route('/api/user/security/2fa/start', methods=['POST'])
@token_required
def start_2fa_setup(current_user):
    data = request.get_json()
    method = data.get('method', 'email')  # 'email' or 'sms'

    # Generate OTP
    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=current_user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()

    # Send OTP
    if method == 'sms':
        send_verification_sms(current_user.phone, otp_code)
    else:
        send_verification_email(current_user.email, otp_code)

    current_user.two_factor_method = method
    db.session.commit()

    return jsonify({'message': f'OTP sent via {method}.', 'method': method}), 200

@app.route('/api/user/security/2fa/verify', methods=['POST'])
@token_required
def verify_2fa_setup(current_user):
    data = request.get_json()
    otp_code = data.get('otp_code')

    otp = OTP.query.filter_by(user_id=current_user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    otp.is_used = True
    current_user.two_factor_enabled = True
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication enabled!'}), 200

@app.route('/api/user/security/2fa/disable', methods=['POST'])
@token_required
def disable_2fa(current_user):
    data = request.get_json()
    password = data.get('password')

    if not current_user or not current_user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401

    current_user.two_factor_enabled = False
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication disabled!'}), 200

@app.route('/api/user/session/<int:session_id>/logout', methods=['POST'])
@token_required
def logout_session(current_user, session_id):
    session = UserSession.query.filter_by(id=session_id, user_id=current_user.id, is_active=True).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    session.is_active = False
    db.session.commit()
    return jsonify({'message': 'Session logged out successfully'})

@app.route('/api/user/sessions', methods=['GET'])
@token_required
def get_user_sessions(current_user):
    sessions = UserSession.query.filter_by(user_id=current_user.id).order_by(UserSession.login_time.desc()).all()
    return jsonify([
        {
            'id': s.id,
            'user_agent': s.user_agent,
            'ip_address': s.ip_address,
            'login_time': s.login_time.isoformat(),
            'last_activity': s.last_activity.isoformat(),
            'is_active': s.is_active
        }
        for s in sessions
    ])

@app.route('/api/user/sessions/logout_all', methods=['POST'])
@token_required
def logout_all_sessions(current_user):
    current_user_agent = request.headers.get('User-Agent', '')
    current_ip = request.remote_addr or ''
    sessions = UserSession.query.filter_by(user_id=current_user.id, is_active=True).all()
    for session in sessions:
        # Keep the current session active, log out others
        if session.user_agent != current_user_agent or session.ip_address != current_ip:
            session.is_active = False
    db.session.commit()
    return jsonify({'message': 'Logged out from all other sessions.'})

@app.route('/api/user/communication', methods=['GET', 'OPTIONS'])
@token_required
def get_communication_preferences(current_user):
    settings = NotificationSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.session.add(settings)
        db.session.commit()
    return jsonify({
        "email_announcements": settings.email_announcements,
        "email_stokvel_updates": settings.email_stokvel_updates,
        "push_announcements": settings.push_announcements
    })

@app.route('/api/user/communication', methods=['PUT', 'OPTIONS'])
@token_required
def update_communication_preferences(current_user):
    data = request.get_json()
    settings = NotificationSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.session.add(settings)
    for field in ["email_announcements", "email_stokvel_updates", "push_announcements"]:
        if field in data:
            setattr(settings, field, data[field])
    db.session.commit()
    return jsonify({"message": "Communication preferences updated successfully"}), 200

@app.route('/api/user/privacy', methods=['GET', 'OPTIONS'])
@token_required
def get_privacy_settings(current_user):
    prefs = UserPreferences.query.filter_by(user_id=current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.session.add(prefs)
        db.session.commit()
    return jsonify({
        "data_for_personalization": prefs.data_for_personalization,
        "data_for_analytics": prefs.data_for_analytics,
        "data_for_third_parties": prefs.data_for_third_parties,
    })

@app.route('/api/user/account', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_account(current_user):
    data = request.get_json() or {}
    password = data.get('password')

    if not current_user or not current_user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401

    db.session.delete(current_user)
    db.session.commit()
    return jsonify({'message': 'Account deleted successfully'})

@app.route('/api/user/referral-details', methods=['GET'])
@token_required
def get_user_referral_details(current_user):
    referral_code = current_user.referral_code
    base_frontend_url = "http://localhost:5173"  # Change to your real frontend
    referral_link = f"{base_frontend_url}/signup?ref={referral_code}"
    return jsonify({
        'referral_code': referral_code,
        'referral_link': referral_link
    }), 200
    
#--------------------------------------------------------Dashboard
@app.route('/api/dashboard/users', methods=['GET'])
@role_required(['admin'])
def get_users():
    # Only admin can access this endpoint
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/dashboard/contributions', methods=['GET'])
@role_required(['admin', 'member'])
def get_contributions():
    # Both admin and members can access this endpoint
    user_id = get_jwt_identity()
    if request.args.get('all') and User.query.get(user_id).role == 'admin':
        # Admin can see all contributions
        contributions = Contribution.query.all()
    else:
        # Members can only see their own contributions
        contributions = Contribution.query.filter_by(user_id=user_id).all()
    return jsonify([contribution.to_dict() for contribution in contributions])


#----------------------------------------------------------------------------------- Wallet routes
@app.route('/api/wallet/balance', methods=['GET'])
@token_required
def get_wallet_balance(current_user):
    """Get user's wallet balance"""
    try:
        wallet = get_or_create_wallet(current_user.id)
        balance = float(wallet.balance) if wallet.balance is not None else 0.0
        return jsonify({
            'balance': balance,
            'currency': 'ZAR'
        }), 200
    except Exception as e:
        print(f"Error getting wallet balance: {str(e)}")
        return jsonify({
            'balance': 0.0,
            'currency': 'ZAR'
        }), 500

@app.route('/api/wallet/transactions', methods=['GET'])
@token_required
def get_wallet_transactions(current_user):
    """Get user's transaction history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        transactions = Transaction.query.filter_by(user_id=current_user.id)\
            .order_by(Transaction.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'transactions': [tx.to_dict() for tx in transactions.items],
            'pages': transactions.pages,
            'current_page': page,
            'total': transactions.total
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wallet/deposit', methods=['POST'])
@token_required
def make_deposit(current_user):
    """Process a deposit to wallet"""
    try:
        data = request.get_json()
        amount = data.get('amount')
        card_id = data.get('card_id')
        description = data.get('description', '')
        
        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        
        if not card_id:
            return jsonify({'error': 'Card ID is required'}), 400
        
        # Verify card belongs to user
        card = Card.query.filter_by(id=card_id, user_id=current_user.id).first()
        if not card:
            return jsonify({'error': 'Invalid card'}), 400
        
        result = process_deposit(current_user.id, amount, card_id, description)
        
        return jsonify({
            'message': f'Deposit successful! R{amount:.2f} added to your wallet',
            'new_balance': result['new_balance'],
            'transaction': result['transaction'],
            'card_last4': card.card_number_last4
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/wallet/transfer', methods=['POST'])
@token_required
def make_transfer(current_user):
    try:
        data = request.get_json()
        print(f"🔍 Transfer request data: {data}")
        
        amount = float(data.get('amount'))
        recipient_account_number = data.get('recipient_account_number')
        description = data.get('description', '')

        print(f"🔍 Amount: {amount}, Recipient: {recipient_account_number}")

        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        if not recipient_account_number:
            return jsonify({'error': 'Recipient account number is required'}), 400

        # Find recipient
        recipient = User.query.filter_by(account_number=recipient_account_number).first()
        print(f" Recipient found: {recipient.full_name if recipient else 'NOT FOUND'}")
        
        if not recipient:
            return jsonify({'error': 'Recipient not found'}), 404
        if recipient.id == current_user.id:
            return jsonify({'error': 'Cannot transfer to yourself'}), 400

        # Get wallets
        sender_wallet = get_or_create_wallet(current_user.id)
        recipient_wallet = get_or_create_wallet(recipient.id)
        
        if sender_wallet.balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400

        # Update balances
        sender_wallet.balance -= amount
        recipient_wallet.balance += amount

        # Generate UNIQUE references for each transaction
        sender_reference = generate_transaction_reference()
        recipient_reference = generate_transaction_reference()
        
        # Create transactions with DIFFERENT references
        sender_transaction = Transaction(
            user_id=current_user.id,
            transaction_type='transfer',
            amount=-amount,
            fee=0.00,
            net_amount=-amount,
            status='completed',
            reference=sender_reference,  # Unique reference
            description=f"Transfer to {recipient.full_name} ({recipient_account_number[-4:]})",
            recipient_email=recipient.email,
            sender_email=current_user.email,
            completed_at=datetime.utcnow()
        )

        recipient_transaction = Transaction(
            user_id=recipient.id,
            transaction_type='transfer',
            amount=amount,
            fee=0.00,
            net_amount=amount,
            status='completed',
            reference=recipient_reference,  # Different unique reference
            description=f"Transfer from {current_user.full_name} ({current_user.account_number[-4:]})",
            recipient_email=recipient.email,
            sender_email=current_user.email,
            completed_at=datetime.utcnow()
        )

        # Create notification for recipient
        recipient_notification = Notification(
            user_id=recipient.id,
            title="Money Received",
            message=f"You received R{amount:.2f} from {current_user.full_name}",
            type="transfer_received",
            data={
                "amount": amount,
                "sender_name": current_user.full_name,
                "sender_account": current_user.account_number[-4:],
                "reference": sender_reference  # Use sender's reference for notification
            }
        )

        db.session.add(sender_transaction)
        db.session.add(recipient_transaction)
        db.session.add(recipient_notification)
        db.session.commit()
        
        print(f"✅ Transfer successful! New balance: {sender_wallet.balance}")

        return jsonify({
            'message': f'Transfer successful to {recipient.full_name}',
            'new_balance': float(sender_wallet.balance),
            'recipient_name': recipient.full_name,
            'reference': sender_reference  # Return sender's reference
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Transfer error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Transfer failed: {str(e)}'}), 500


@app.route('/api/wallet/withdraw', methods=['POST'])
@token_required
def withdraw(current_user):
    try:
        data = request.get_json()
        amount = data.get('amount')
        bank_account_number = data.get('bank_account_number')
        description = data.get('description', '')

        # Enhanced validation
        if not amount or amount < MIN_WITHDRAWAL_AMOUNT:
            return jsonify({'error': f'Minimum withdrawal amount is R{MIN_WITHDRAWAL_AMOUNT:.2f}'}), 400
        if amount > MAX_WITHDRAWAL_AMOUNT:
            return jsonify({'error': f'Maximum withdrawal amount is R{MAX_WITHDRAWAL_AMOUNT:.2f}'}), 400
        if not bank_account_number:
            return jsonify({'error': 'Bank account number is required'}), 400
        if len(bank_account_number) != 10:
            return jsonify({'error': 'Bank account number must be exactly 10 digits'}), 400
        
        # Get or create wallet
        wallet = get_or_create_wallet(current_user.id)
        if wallet.balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400

        # Calculate fees
        fee = amount * WITHDRAWAL_FEE_PERCENTAGE
        total_deduction = amount + fee
        
        if wallet.balance < total_deduction:
            return jsonify({'error': f'Insufficient balance. Need R{total_deduction:.2f} (R{amount:.2f} + R{fee:.2f} fee)'}), 400

        # Create withdrawal transaction record
        transaction = Transaction(
            user_id=current_user.id,
            transaction_type='withdrawal',
            amount=amount,
            fee=fee,
            net_amount=-total_deduction,  # Negative for withdrawals
            status='completed',
            reference=generate_transaction_reference(),
            description=f"Withdrawal to bank account ending in {bank_account_number[-4:]} (Fee: R{fee:.2f})",
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        
        # Deduct from wallet
        wallet.balance -= total_deduction
        db.session.commit()

        return jsonify({
            'message': 'Withdrawal successful',
            'new_balance': float(wallet.balance),
            'amount_withdrawn': float(amount),
            'fee_charged': float(fee),
            'total_deduction': float(total_deduction),
            'reference': transaction.reference
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Withdrawal error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Withdrawal failed: {str(e)}'}), 500
    
@app.route('/api/wallet/analytics', methods=['GET'])
@token_required
def get_wallet_analytics(current_user):
    """Get wallet analytics and insights"""
    try:
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get transactions in date range
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            Transaction.created_at >= start_date,
            Transaction.created_at <= end_date
        ).all()
        
        # Calculate analytics
        total_deposits = sum(tx.amount for tx in transactions if tx.transaction_type == 'deposit' and tx.status == 'completed')
        total_transfers_out = abs(sum(tx.amount for tx in transactions if tx.transaction_type == 'transfer' and tx.amount < 0 and tx.status == 'completed'))
        total_transfers_in = sum(tx.amount for tx in transactions if tx.transaction_type == 'transfer' and tx.amount > 0 and tx.status == 'completed')
        total_fees = sum(tx.fee for tx in transactions if tx.fee)
        
        # Monthly breakdown
        monthly_data = db.session.query(
            func.to_char(Transaction.created_at, 'YYYY-MM').label('month'),
            func.sum(Transaction.amount).label('total'),
            func.count(Transaction.id).label('count')
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.created_at >= start_date,
            Transaction.status == 'completed'
        ).group_by('month').order_by('month').all()
        
        return jsonify({
            'period': f'Last {days} days',
            'summary': {
                'total_deposits': float(total_deposits),
                'total_transfers_out': float(total_transfers_out),
                'total_transfers_in': float(total_transfers_in),
                'total_fees': float(total_fees),
                'net_flow': float(total_deposits + total_transfers_in - total_transfers_out)
            },
            'monthly_breakdown': [
                {
                    'month': row.month,
                    'total': float(row.total),
                    'count': row.count
                } for row in monthly_data
            ],
            'transaction_count': len(transactions)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/wallet/export', methods=['GET'])
@token_required
def export_transactions(current_user):
    """Export transactions as CSV"""
    try:
        from io import StringIO
        import csv
        
        # Get date range
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get transactions
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.id,
            Transaction.created_at >= start_date,
            Transaction.created_at <= end_date
        ).order_by(Transaction.created_at.desc()).all()
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Date', 'Type', 'Amount', 'Fee', 'Net Amount', 'Status', 'Reference', 'Description'])
        
        for tx in transactions:
            writer.writerow([
                tx.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                tx.transaction_type,
                f"R{tx.amount:.2f}",
                f"R{tx.fee:.2f}",
                f"R{tx.net_amount:.2f}",
                tx.status,
                tx.reference,
                tx.description
            ])
        
        output.seek(0)
        
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=transactions_{datetime.utcnow().strftime("%Y%m%d")}.csv'
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wallet/cards', methods=['GET'])
@token_required
def get_cards(current_user):
    cards = Card.query.filter_by(user_id=current_user.id).all()
    return jsonify([card.to_dict() for card in cards]), 200

@app.route('/api/wallet/cards', methods=['POST'])
@token_required
def add_card(current_user):
    data = request.get_json(force=True)  # force=True ensures JSON is parsed
    print("📦 Raw JSON Payload:", data)

    if not data:
        return jsonify({'error': 'No data received'}), 400
    # Validate required fields
    required_fields = ['cardholder', 'cardNumber', 'expiry', 'cvv']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate card details
    card_number = data['cardNumber'].replace(' ', '').replace('-', '')
    expiry = data['expiry']
    cvv = data['cvv']
    
    is_valid, result = validate_card(card_number, expiry, cvv)
    if not is_valid:
        error_messages = {
            'invalid_length': 'Card number must be 13-19 digits',
            'invalid_number': 'Invalid card number',
            'invalid_expiry': 'Invalid expiry date',
            'expired': 'Card has expired',
            'invalid_expiry_format': 'Invalid expiry format (MM/YY)',
            'invalid_cvv': 'Invalid CVV'
        }
        return jsonify({'error': error_messages.get(result, 'Invalid card details')}), 400
    
    card_type = Card.detect_card_type(card_number)
    
    # Extract last 4 digits from card number
    last4 = card_number[-4:]
    
    # Create new card
    new_card = Card(
        user_id=current_user.id,
        cardholder=data['cardholder'],
        card_number_last4=last4,
        expiry=expiry,
        card_type=card_type,
        is_primary=data.get('primary', False)
    )
    
    # If this is set as primary, unset other primary cards
    if new_card.is_primary:
        Card.query.filter_by(user_id=current_user.id, is_primary=True).update({'is_primary': False})
    
    db.session.add(new_card)
    db.session.commit()
    
    return jsonify({
        'message': 'Card added successfully',
        'card': new_card.to_dict()
    }), 201

@app.route('/api/wallet/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    card = Card.query.get(card_id)
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    db.session.delete(card)
    db.session.commit()
    return jsonify({'message': 'Card deleted successfully'}), 200

#------------------------------------------------------------------------------- Stokvel routes
@app.route('/api/stokvel/register-group', methods=['POST'])
@token_required
def register_stokvel_group(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'contribution_amount', 'frequency', 'max_members']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Generate unique group code
        while True:
            group_code = generate_group_code()
            if not StokvelGroup.query.filter_by(group_code=group_code).first():
                break

        # Create new stokvel group
        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            category=data['category'],  # <-- ADD THIS LINE
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            rules=data['rules'],
            tier=data['tier'],
            group_code=group_code,
            admin_id=current_user.id
        )
        
        db.session.add(new_group)
        
        # Create membership for the admin
        admin_membership = StokvelMember(
            user_id=current_user.id,
            group_id=new_group.id,
            status='active',
            role='admin'
        )
        
        db.session.add(admin_membership)
        db.session.commit()
        
        return jsonify({
            'message': 'Stokvel group created successfully',
            'group': new_group.to_dict(),
            'group_code': group_code  # Send this to admin to share with members
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stokvel/join-group', methods=['POST'])
@jwt_required()
def join_group():
    user_id = get_jwt_identity()
    data = request.get_json()
    category = data.get('category')
    tier = data.get('tier')
    amount = data.get('amount')

    # Check for existing pending request
    existing = GroupJoinRequest.query.filter_by(
        user_id=user_id, category=category, tier=tier, amount=amount, status='pending'
    ).first()
    if existing:
        return jsonify({"error": "You already have a pending request for this group/tier/amount."}), 400

    # Create new join request WITH created_at
    join_request = GroupJoinRequest(
        user_id=user_id,
        category=category,
        tier=tier,
        amount=amount,
        status='pending',
        created_at=datetime.utcnow()  # <-- THIS IS THE FIX
    )
    db.session.add(join_request)
    db.session.commit()
    return jsonify({"message": "Join request submitted."}), 201

@app.route('/api/groups/available', methods=['GET'])
def get_available_groups():
    groups = StokvelGroup.query.all()
    return jsonify([{
        'id': g.id,
        'name': g.name,
        'category': g.category,  # <-- ADD THIS LINE
        'tier': g.tier,
        'amount': g.amount,
        'rules': g.rules,
        'benefits': g.benefits,
        'description': g.description,
        'frequency': g.frequency,
        'max_members': g.max_members,
        # ... any other fields you want to expose ...
    } for g in groups])

@app.route('/api/polls', methods=['GET'])
@token_required
def get_polls(current_user):
    polls = Poll.query.filter_by(group_id=current_user.group_id).all()
    return jsonify([{
        'id': poll.id,
        'title': poll.title,
        'description': poll.description,
        'end_date': poll.end_date.isoformat() if poll.end_date else None,
        'status': poll.status,
        'options': [{
            'id': option.id,
            'text': option.text,
            'votes': option.votes
        } for option in poll.options]
    } for poll in polls])

@app.route('/api/polls', methods=['POST'])
@token_required
def create_poll(current_user):
    data = request.get_json()
    poll = Poll(
        group_id=current_user.group_id,
        title=data['title'],
        description=data.get('description'),
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None
    )
    db.session.add(poll)
    db.session.commit()
    
    for option_text in data['options']:
        option = PollOption(poll_id=poll.id, text=option_text)
        db.session.add(option)
    
    try:
        db.session.commit()
        return jsonify({'message': 'Poll created successfully', 'poll_id': poll.id})
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500

@app.route('/api/meetings', methods=['GET'])
@token_required
def get_meetings(current_user):
    meetings = Meeting.query.filter_by(group_id=current_user.group_id).all()
    return jsonify([{
        'id': meeting.id,
        'title': meeting.title,
        'description': meeting.description,
        'date': meeting.date.isoformat(),
        'location': meeting.location,
        'status': meeting.status
    } for meeting in meetings])

@app.route('/api/meetings', methods=['POST'])
@token_required
def create_meeting(current_user):
    data = request.get_json()
    meeting = Meeting(
        group_id=current_user.group_id,
        title=data['title'],
        description=data.get('description'),
        date=datetime.fromisoformat(data['date']),
        location=data.get('location')
    )
    db.session.add(meeting)
    db.session.commit()
    return jsonify({'message': 'Meeting created successfully', 'meeting_id': meeting.id})



@app.route('/api/withdrawals', methods=['GET'])
@token_required
def get_withdrawals(current_user):
    withdrawals = WithdrawalRequest.query.filter_by(member_id=current_user.id).all()
    return jsonify([{
        'id': w.id,
        'amount': w.amount,
        'reason': w.reason,
        'created_at': w.created_at.isoformat(),
        'status': w.status,
        'approvals_needed': w.approvals_needed,
        'approvals_received': w.approvals_received
    } for w in withdrawals])

@app.route('/api/withdrawals', methods=['POST'])
@token_required
def create_withdrawal(current_user):
    data = request.get_json()
    withdrawal = WithdrawalRequest(
        member_id=current_user.id,
        amount=data['amount'],
        reason=data.get('reason'),
        approvals_needed=data.get('approvals_needed', 2)
    )
    db.session.add(withdrawal)
    db.session.commit()
    return jsonify({'message': 'Withdrawal request created successfully', 'withdrawal_id': withdrawal.id})

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    try:
        # Get user's role in each group
        memberships = StokvelMember.query.filter_by(user_id=current_user.id).all()
        is_group_admin = any(m.role == 'admin' for m in memberships)
        
        # Get user's active groups
        active_groups = [m.group for m in memberships if m.status == 'active']
        
        # Get total contributions
        total_contributions = db.session.query(func.sum(Contribution.amount)) \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .scalar() or 0.0

        # Get recent transactions
        recent_transactions = Contribution.query \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .order_by(Contribution.date.desc()) \
            .limit(5) \
            .all()

        # Get monthly contribution summary
        monthly_contributions = db.session.query(
            func.to_char(Contribution.date, 'YYYY-MM').label('month'),
            func.sum(Contribution.amount).label('total')
        ) \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .group_by('month') \
            .order_by('month') \
            .all()

        # Get wallet balance
        wallet_balance = current_user.wallet[0].balance if current_user.wallet else 0.0

        # Get group-specific stats if user is a group admin
        group_stats = []
        if is_group_admin:
            for membership in memberships:
                if membership.role == 'admin':
                    group = membership.group
                    group_contributions = db.session.query(func.sum(Contribution.amount)) \
                        .join(StokvelMember) \
                        .filter(StokvelMember.group_id == group.id) \
                        .scalar() or 0.0
                    
                    group_stats.append({
                        'group_id': group.id,
                        'group_name': group.name,
                        'total_contributions': float(group_contributions),
                        'member_count': len(group.members),
                        'active_members': len([m for m in group.members if m.status == 'active']),
                        'group_code': group.group_code
                    })

        return jsonify({
            'user': {
                'id': current_user.id,
                'name': current_user.full_name,
                'email': current_user.email,
                'role': current_user.role,
                'is_group_admin': is_group_admin
            },
            'walletBalance': float(wallet_balance),
            'activeGroupsCount': len(active_groups),
            'totalContributions': float(total_contributions),
            'recentTransactions': [{
                'id': t.id,
                'amount': float(t.amount),
                'date': t.date.isoformat(),
                'type': 'deposit',
                'description': f'Contribution to {t.member.group.name}'
            } for t in recent_transactions],
            'monthlySummary': [{'month': row.month, 'total': float(row.total)} for row in monthly_contributions],
            'groupStats': group_stats if is_group_admin else [],
            'activeGroups': [{
                'id': g.id,
                'name': g.name,
                'role': next(m.role for m in memberships if m.group_id == g.id),
                'contribution_amount': float(g.contribution_amount),
                'frequency': g.frequency
            } for g in active_groups]
        })

    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500
    
@app.route('/api/groups/<int:group_id>/contribute', methods=['POST'])
@jwt_required()
def contribute_to_group(group_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    amount = data.get('amount')
    method = data.get('method')  # "wallet" or "bank"
    card_id = data.get('card_id')  # Only needed for "bank"

    # 1. Check user is a member of the group
    member = StokvelMember.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not member:
        return jsonify({'error': 'You are not a member of this group.'}), 403

    group = StokvelGroup.query.get_or_404(group_id)
    if not amount or amount < group.contribution_amount:
        return jsonify({'error': f'Minimum contribution is R{group.contribution_amount}.'}), 400

    # 2. Handle payment
    if method == "wallet":
        wallet = Wallet.query.filter_by(user_id=user_id).first()
        if not wallet or wallet.balance < amount:
            return jsonify({'error': 'Insufficient wallet balance.'}), 400
        wallet.balance -= amount
    elif method == "bank":
        # Simulate deposit to wallet first
        if not card_id:
            return jsonify({'error': 'Card ID required for bank payment.'}), 400
        # You can call your process_deposit logic here
        # For now, just add to wallet
        wallet = Wallet.query.filter_by(user_id=user_id).first()
        wallet.balance += amount  # Simulate deposit
        wallet.balance -= amount  # Then deduct for contribution
    else:
        return jsonify({'error': 'Invalid payment method.'}), 400

    # 3. Create contribution record
    contribution = Contribution(
        member_id=member.id,
        amount=amount,
        status='confirmed'
    )
    db.session.add(contribution)

    # 4. Create transaction record for dashboard/wallet
    from datetime import datetime
    transaction = Transaction(
        user_id=user_id,
        transaction_type='stokvel_contribution',
        amount=amount,
        fee=0.00,
        net_amount=amount,
        status='completed',
        reference=generate_transaction_reference(),
        description=f"Contribution to {group.name}",
        completed_at=datetime.utcnow()
    )
    db.session.add(transaction)
    db.session.commit()

    return jsonify({'message': 'Contribution successful!'}), 200

@app.route('/api/dashboard/my-groups', methods=['GET'])
@jwt_required()
def get_my_groups():
    user_id = get_jwt_identity()
    memberships = StokvelMember.query.filter_by(user_id=user_id).all()
    groups = []
    for m in memberships:
        group = StokvelGroup.query.get(m.group_id)
        if group:
            groups.append({
                "id": group.id,
                "name": group.name,
                "category": group.category,
                "tier": group.tier,
                "description": group.description,
                "member_count": len(group.members)
            })
    return jsonify(groups)

@app.route('/api/user/groups', methods=['GET'])
@jwt_required()
def get_user_groups():
    user_id = get_jwt_identity()
    # Adjust this query to match your group membership logic
    groups = StokvelGroup.query.join(StokvelMember).filter(StokvelMember.user_id == user_id).all()
    return jsonify([
        {
            "id": g.id,
            "name": g.name,
            "category": g.category,
            "rules": getattr(g, "rules", ""),
            "claimable_amount": getattr(g, "claimable_amount", 0)
        }
        for g in groups
    ])
    
@app.route('/api/user/join-requests', methods=['GET'])
@jwt_required()
def get_user_join_requests():
    user_id = get_jwt_identity()
    requests = GroupJoinRequest.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": r.id,
            "group_id": r.group_id,
            "group_name": r.group.name if r.group else "",
            "category": r.category,
            "tier": r.tier,
            "amount": r.amount,
            "status": r.status,
            "reason": r.reason,
            "created_at": r.created_at.isoformat(),
        }
        for r in requests
    ])


#-------------------------------------------------------------------------------------- KYC routes
@app.route('/api/kyc/update', methods=['PATCH'])
@token_required
def update_kyc(current_user):
    # Find existing KYC record or create a new one in 'draft' state
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).first()
    if not kyc:
        kyc = KYCVerification(user_id=current_user.id, status='draft')
        db.session.add(kyc)

    # Handle file uploads
    if request.files:
        files = request.files
        
        def save_file(field_name):
            file = files.get(field_name)
            if file and file.filename:
                # Validate file type
                allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
                file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                
                if file_extension not in allowed_extensions:
                    raise ValueError(f'File type .{file_extension} is not allowed. Please upload PDF, JPG, PNG, or DOC files.')
                
                # Validate file size (10MB limit)
                file.seek(0, 2)  # Seek to end
                file_size = file.tell()
                file.seek(0)  # Reset to beginning
                
                if file_size > 10 * 1024 * 1024:  # 10MB
                    raise ValueError('File size must be less than 10MB.')
                
                filename = secure_filename(f"{current_user.id}_{field_name}_{file.filename}")
                file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
                file.save(file_path)
                return file_path
            return None

        # Save uploaded files and update database paths
        if 'documents.idDocument' in files:
            kyc.id_document_path = save_file('documents.idDocument')
        if 'documents.proofOfAddress' in files:
            kyc.proof_of_address_path = save_file('documents.proofOfAddress')
        if 'documents.proofOfIncome' in files:
            kyc.proof_of_income_path = save_file('documents.proofOfIncome')
        if 'documents.bankStatement' in files:
            kyc.bank_statement_path = save_file('documents.bankStatement')

    # Handle JSON data for form fields
    if request.is_json:
        data = request.get_json()
        
        # Map frontend camelCase to backend snake_case
        key_map = {
            'fullName': 'full_name', 'dateOfBirth': 'date_of_birth', 'idNumber': 'id_number',
            'employmentStatus': 'employment_status', 'employerName': 'employer_name',
            'streetAddress': 'street_address', 'postalCode': 'postal_code', 'monthlyIncome': 'monthly_income',
            'incomeSource': 'income_source', 'employmentType': 'employment_type', 'bankName': 'bank_name',
            'accountNumber': 'account_number', 'accountType': 'account_type', 'branchCode': 'branch_code'
        }

        # data will be like {'personal': {'fullName': 'John'}}
        section_data = list(data.values())[0]

        for camel_key, value in section_data.items():
            snake_key = key_map.get(camel_key, camel_key)
            if hasattr(kyc, snake_key):
                # Safely handle empty strings for numeric fields
                if snake_key == 'monthly_income' and (value == '' or value is None):
                    setattr(kyc, snake_key, None)
                else:
                    setattr(kyc, snake_key, value)

    try:
        db.session.commit()
        return jsonify({'message': 'KYC details saved successfully!'}), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred while saving KYC data.'}), 500

@app.route('/api/kyc/submit', methods=['POST'])
@token_required
def submit_kyc(current_user):
    # The final submission now assumes a draft KYC record exists
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).first()
    if not kyc:
        return jsonify({'error': 'Please save your details before submitting.'}), 400

    files = request.files

    def save_file(field):
        file = files.get(field)
        if file:
            filename = secure_file(f"{current_user.id}_{field}_{file.filename}")
            file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
            file.save(file_path)
            return file_path
        return None

    # Update document paths
    kyc.id_document_path = save_file('documents.idDocument') or kyc.id_document_path
    kyc.proof_of_address_path = save_file('documents.proofOfAddress') or kyc.proof_of_address_path
    kyc.proof_of_income_path = save_file('documents.proofOfIncome') or kyc.proof_of_income_path
    kyc.bank_statement_path = save_file('documents.bankStatement') or kyc.bank_statement_path
    
    # Change status to 'pending' for review
    kyc.status = 'pending'
    db.session.commit()

    return jsonify({'message': 'KYC submitted successfully for review', 'kyc_id': kyc.id}), 201

@app.route('/api/kyc/status', methods=['GET'])
@token_required
def get_kyc_status(current_user):
    kyc = KYCVerification.query.filter(
        KYCVerification.user_id == current_user.id,
        KYCVerification.status != 'draft'
    ).order_by(KYCVerification.updated_at.desc()).first()
    if not kyc:
        return jsonify({'status': 'not_submitted', 'message': 'No KYC submission found.'}), 200

    return jsonify({
        'status': kyc.status,
        'full_name': kyc.full_name,
        'date_of_birth': str(kyc.date_of_birth) if kyc.date_of_birth else None,
        'id_number': kyc.id_number,
        'phone': kyc.phone,
        'email': kyc.email,
        'employment_status': kyc.employment_status,
        'employer_name': kyc.employer_name,
        'street_address': kyc.street_address,
        'city': kyc.city,
        'province': kyc.province,
        'postal_code': kyc.postal_code,
        'country': kyc.country,
        'monthly_income': kyc.monthly_income,
        'income_source': kyc.income_source,
        'employment_type': kyc.employment_type,
        'bank_name': kyc.bank_name,
        'account_number': kyc.account_number,
        'account_type': kyc.account_type,
        'branch_code': kyc.branch_code,
        'id_document_path': kyc.id_document_path,
        'proof_of_address_path': kyc.proof_of_address_path,
        'proof_of_income_path': kyc.proof_of_income_path,
        'bank_statement_path': kyc.bank_statement_path,
        'verification_date': str(kyc.verification_date) if kyc.verification_date else None,
        'rejection_reason': kyc.rejection_reason,
        'created_at': str(kyc.created_at),
        'updated_at': str(kyc.updated_at),
        "status": get_status(kyc)
    }), 200
    
#----------------------------------------------------------------------------------------------- Admin routes

@app.route('/api/admin/kyc/submissions', methods=['GET'])
@role_required(['admin'])
def get_kyc_submissions():
    """Get all KYC submissions for admin review"""
    try:
        submissions = KYCVerification.query.all()
        submissions_data = []
        
        for submission in submissions:
            user = User.query.get(submission.user_id)
            submissions_data.append({
                'id': submission.id,
                'user_id': submission.user_id,
                'user_email': user.email if user else 'Unknown',
                'user_name': user.full_name if user else 'Unknown',
                'status': submission.status,
                'full_name': submission.full_name,
                'email': submission.email,
                'phone': submission.phone,
                'id_number': submission.id_number,
                'employment_status': submission.employment_status,
                'bank_name': submission.bank_name,
                'account_number': submission.account_number,
                'id_document_path': submission.id_document_path,
                'proof_of_address_path': submission.proof_of_address_path,
                'proof_of_income_path': submission.proof_of_income_path,
                'bank_statement_path': submission.bank_statement_path,
                'created_at': submission.created_at.isoformat(),
                'updated_at': submission.updated_at.isoformat(),
                'rejection_reason': submission.rejection_reason
            })
        
        return jsonify(submissions_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/<int:submission_id>/approve', methods=['POST'])
@role_required(['admin'])
def approve_kyc(submission_id):
    """Approve a KYC submission"""
    try:
        kyc = KYCVerification.query.get(submission_id)
        if not kyc:
            return jsonify({'error': 'KYC submission not found'}), 404
        
        kyc.status = 'approved'
        kyc.verification_date = datetime.utcnow()
        
        # Update user verification status
        user = User.query.get(kyc.user_id)
        if user:
            user.is_verified = True
        
        db.session.commit()

        # On approval
        notification = Notification(
            user_id=kyc.user_id,
            title="KYC Approved",
            message="Your KYC verification has been approved! You can now join groups.",
            type="kyc_approved",
            data={}
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({'message': 'KYC submission approved successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/<int:submission_id>/reject', methods=['POST'])
@role_required(['admin'])
def reject_kyc(submission_id):
    """Reject a KYC submission"""
    try:
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', 'No reason provided')
        
        kyc = KYCVerification.query.get(submission_id)
        if not kyc:
            return jsonify({'error': 'KYC submission not found'}), 404
        
        kyc.status = 'rejected'
        kyc.rejection_reason = rejection_reason
        
        db.session.commit()

        # On rejection
        notification = Notification(
            user_id=kyc.user_id,
            title="KYC Rejected",
            message=f"Your KYC verification was rejected. Reason: {kyc.rejection_reason}",
            type="kyc_rejected",
            data={}
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({'message': 'KYC submission rejected successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/kyc/document/<path:filename>', methods=['GET'])
@token_required
def download_kyc_document(current_user, filename):
    """Download a KYC document (only accessible by the document owner or admin)"""
    try:
        # Check if user is admin or the document belongs to them
        if current_user.role != 'admin':
            # Extract user_id from filename (format: user_id_fieldname_originalname)
            filename_parts = filename.split('_')
            if len(filename_parts) < 2 or filename_parts[0] != str(current_user.id):
                return jsonify({'error': 'Access denied'}), 403
        
        file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/stats', methods=['GET'])
@role_required(['admin'])
def get_kyc_stats():
    try:
        pending_count = KYCVerification.query.filter_by(status='pending').count()
        approved_count = KYCVerification.query.filter_by(status='approved').count()
        rejected_count = KYCVerification.query.filter_by(status='rejected').count()
        
        return jsonify({
            'pending': pending_count,
            'approved': approved_count,
            'rejected': rejected_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/groups', methods=['GET'])
@token_required
def get_admin_groups(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    groups = StokvelGroup.query.all()
    groups_data = []
    for group in groups:
        groups_data.append(StokvelGroup.to_dict(group))
    return jsonify(groups_data), 200

@app.route('/api/admin/groups', methods=['POST'])
@jwt_required()
def create_group():
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description', '')
        category = data.get('category')
        tier = data.get('tier')
        contribution_amount = data.get('contributionAmount')
        frequency = data.get('frequency')
        max_members = data.get('maxMembers')
        group = StokvelGroup(
            name=name,
            description=description,
            category=category,
            tier=tier,
            contribution_amount=contribution_amount,
            frequency=frequency,
            max_members=max_members
        )
        db.session.add(group)
        db.session.commit()
        print("Created group:", group.id, group.name, group.status)
        return jsonify({'message': 'Group created', 'id': group.id}), 201
    except Exception as e:
        import traceback
        print("Group creation error:", e)
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

@app.route('/api/admin/groups/<int:group_id>', methods=['PUT'])
@token_required
def update_group(current_user, group_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    group = StokvelGroup.query.get_or_404(group_id)
    data = request.get_json()
    group.name = data.get('name', group.name)
    group.description = data.get('description', group.description)
    group.contribution_amount = float(data.get('contribution_amount', group.amount))
    group.frequency = data.get('frequency', group.frequency)
    group.max_members = int(data.get('max_members', group.max_members))
    group.tier = data.get('tier', group.tier)  # Add this if you have a tier field

    db.session.commit()
    return jsonify({'message': 'Group updated successfully'}), 200

@app.route('/api/admin/groups/<int:group_id>', methods=['GET'])
@jwt_required()
def get_group_details(group_id):
    group = StokvelGroup.query.get_or_404(group_id)
    # Optionally, fetch members and join requests here
    return jsonify({
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'category': group.category,
        'tier': group.tier,
        'contributionAmount': group.contribution_amount,
        'frequency': group.frequency,
        'maxMembers': group.max_members,
        'createdAt': group.created_at,
    })

@app.route('/api/admin/groups/<int:group_id>/members', methods=['GET'])
@jwt_required()
def get_group_members(group_id):
    # Assuming a relationship exists
    group = StokvelGroup.query.get_or_404(group_id)
    # Replace with your actual member fetching logic
    members = User.query.join(StokvelMember).filter(StokvelMember.group_id == group_id).all()
    return jsonify([
        {
            "id": m.id,
            "full_name": getattr(m, "full_name", None) or getattr(m, "name", None),  # <-- Use full_name instead of name
            "email": m.email,
            # ...
        } for m in members
    ])

@app.route('/api/admin/groups/<int:group_id>/requests', methods=['GET'])
@jwt_required()
def get_group_requests(group_id):
    requests = GroupJoinRequest.query.filter_by(group_id=group_id).all()
    return jsonify([{
        'id': r.id,
        'userId': r.user_id,
        'status': r.status,
        'reason': r.reason,
        'createdAt': r.created_at.isoformat() if r.created_at else None,
    } for r in requests])

@app.route('/api/admin/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_request(request_id):
    req = GroupJoinRequest.query.get_or_404(request_id)
    req.status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Request approved'})

@app.route('/api/admin/requests/<int:request_id>/deny', methods=['POST'])
@jwt_required()
def deny_request(request_id):
    req = GroupJoinRequest.query.get_or_404(request_id)
    req.status = 'rejected'
    req.reason = request.json.get('reason', '')
    db.session.commit()
    return jsonify({'message': 'Request denied'})

def join_request_to_dict(jr):
    return {
        "id": jr.id,
        "user_id": jr.user_id,
        "user": {
            "id": jr.user.id,
            "name": jr.user.full_name,
            "email": jr.user.email,
            # ...other user fields...
        } if jr.user else None,
        # ... other fields ...
    }

@app.route('/api/admin/groups/<int:group_id>', methods=['DELETE'])
@token_required
def delete_group(current_user, group_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    group = StokvelGroup.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    return jsonify({'message': 'Group deleted successfully'}), 200

@app.route('/api/admin/stats', methods=['GET'])
@token_required
def get_admin_stats(current_user):
    # Your implementation here
    pass

@app.route('/api/admin/join-requests', methods=['GET'])
@jwt_required()
def get_admin_join_requests():
    requests = GroupJoinRequest.query.all()
    return jsonify([
        {
            "id": r.id,
            "user": r.user.full_name if r.user else "",
            "category": r.category,
            "tier": r.tier,
            "amount": r.amount,
            "status": r.status,
            "reason": r.reason,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in requests
    ])

@app.route('/api/admin/join-requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_join_request(request_id):
    req = GroupJoinRequest.query.get_or_404(request_id)
    user_id = req.user_id
    category = req.category
    tier = req.tier
    amount = req.amount

    # 1. Find or create the group
    group = StokvelGroup.query.filter_by(category=category, tier=tier).first()
    if not group:
        group = StokvelGroup(
            name=f"{category} {tier}",
            category=category,
            tier=tier,
            status="active",
            contribution_amount=amount,
            frequency="monthly",  # or get from req or default
            max_members=100,      # or get from req or default
        )
        db.session.add(group)
        db.session.commit()

    # 2. Add user as member if not already
    if not StokvelMember.query.filter_by(user_id=user_id, group_id=group.id).first():
        member = StokvelMember(user_id=user_id, group_id=group.id)
        db.session.add(member)

    # 3. Approve the join request
    req.status = "approved"
    req.group_id = group.id
    db.session.commit()

    # After adding user to group
    notification = Notification(
        user_id=user_id,  # <-- Use user_id instead of approved_user.id
        title="Group Join Approved",
        message=f"You have been approved to join {group.name} ({tier})!",
        type="group_join_approved",
        data={"group_id": group.id, "tier": tier}
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({"success": True})

@app.route('/api/admin/join-requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_join_request(request_id):
    data = request.get_json()
    reason = data.get('reason', '')
    req = GroupJoinRequest.query.get_or_404(request_id)
    req.status = 'rejected'
    req.reason = reason
    db.session.commit()
    return jsonify({'message': 'Request rejected'})

@app.route('/api/admin/join-requests/delete-all', methods=['DELETE'])
@jwt_required()
def delete_all_join_requests():
    GroupJoinRequest.query.delete()
    db.session.commit()
    return jsonify({'message': 'All join requests deleted'})

@app.route('/api/admin/join-requests/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_join_requests():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'error': 'No IDs provided'}), 400
    GroupJoinRequest.query.filter(GroupJoinRequest.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'message': 'Selected join requests deleted'})

@app.route('/api/admin/notifications', methods=['GET'])
@jwt_required()
def get_admin_notifications():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Get notifications for admin users
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'data': n.data,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications])

@app.route('/api/admin/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_admin_notification_read(notification_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    
    if notification:
        notification.is_read = True
        db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})

@app.route('/api/admin/claims', methods=['GET'])
@token_required
@admin_required
def get_all_claims(current_user):
    status = request.args.get('status', 'pending')
    claims = db.session.query(Claim).filter_by(status=status).order_by(Claim.created_at.desc()).all()
    
    return jsonify([{
        'id': claim.id,
        'user': claim.user.full_name,
        'amount': claim.amount,
        'status': claim.status,
        'fraud_score': claim.fraud_score,
        'fraud_indicators': json.loads(claim.fraud_indicators) if claim.fraud_indicators else [],
        'created_at': claim.created_at.isoformat()
    } for claim in claims])
    
@app.route('/api/admin/concerns', methods=['GET'])
@role_required(['admin'])
def get_all_concerns():
    # Query params
    status = request.args.get('status')
    search = request.args.get('search')
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=20, type=int)

    query = CustomerConcern.query

    # Filter by status
    if status:
        query = query.filter(CustomerConcern.status == status)

    # Search by keyword
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                CustomerConcern.name.ilike(like),
                CustomerConcern.email.ilike(like),
                CustomerConcern.subject.ilike(like)
            )
        )

    total = query.count()
    concerns = query.order_by(CustomerConcern.created_at.desc()) \
        .offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        'total': total,
        'page': page,
        'limit': limit,
        'concerns': [c.to_dict() for c in concerns]
    }), 200
    
@app.route('/api/admin/beneficiaries', methods=['GET'])
@jwt_required()  # Or use your admin role decorator if you have one
def get_all_beneficiaries():
    beneficiaries = Beneficiary.query.all()
    return jsonify([{
        "id": b.id,
        "name": b.name,
        "id_number": b.id_number,
        "relationship": b.relationship,
        "phone": b.phone,
        "email": b.email,
        "created_at": b.created_at,
        "id_doc_url": b.id_doc_url,
        "address_doc_url": b.address_doc_url,
        "relationship_doc_url": b.relationship_doc_url,
        "status": b.status,  # <-- Make sure this is included!
        "user_id": b.user_id
    } for b in beneficiaries])

# Approve beneficiary
@app.route('/api/admin/beneficiaries/<int:beneficiary_id>/approve', methods=['POST'])
@jwt_required()  # Or your admin role decorator
def approve_beneficiary(beneficiary_id):
    beneficiary = Beneficiary.query.get_or_404(beneficiary_id)
    beneficiary.status = "Approved"
    db.session.commit()
    # Send notification to user
    notification = Notification(
        user_id=beneficiary.user_id,
        title="Beneficiary Approved",
        message=f"Your beneficiary '{beneficiary.name}' has been approved.",
        type="beneficiary"
    )
    db.session.add(notification)
    db.session.commit()
    return jsonify({"message": "Beneficiary approved"})

# Reject beneficiary
@app.route('/api/admin/beneficiaries/<int:beneficiary_id>/reject', methods=['POST'])
@jwt_required()
def reject_beneficiary(beneficiary_id):
    beneficiary = Beneficiary.query.get_or_404(beneficiary_id)
    beneficiary.status = "Rejected"
    db.session.commit()
    # Send notification to user
    notification = Notification(
        user_id=beneficiary.user_id,
        title="Beneficiary Rejected",
        message=f"Your beneficiary '{beneficiary.name}' has been rejected.",
        type="beneficiary"
    )
    db.session.add(notification)
    db.session.commit()
    return jsonify({"message": "Beneficiary rejected"})

@app.route('/api/admin/team', methods=['GET'])
@role_required(['admin', 'super_admin', 'manager'])
# @mfa_required
def list_admins():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    search = request.args.get('search', '')
    role_filter = request.args.get('role', '')

    query = User.query.filter(User.role == 'admin')
    if search:
        like = f"%{search}%"
        query = query.filter(or_(
            User.full_name.ilike(like), 
            User.email.ilike(like)
        ))
    if role_filter:
        query = query.join(AdminRole).filter(AdminRole.name == role_filter)
    total = query.count()
    admins = query.order_by(User.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return jsonify({
        'total': total,
        'page': page,
        'limit': limit,
        'admins': [{
            'id': a.id,
            'name': a.full_name,
            'email': a.email,
            'role': a.admin_role.name if a.admin_role else None,
            'mfa_enabled': a.mfa_enabled,
            'is_locked': a.locked_until and a.locked_until > datetime.utcnow(),
            'created_at': a.created_at.isoformat(),
            'last_activity': a.admin_sessions[-1].last_activity.isoformat() if a.admin_sessions else None
        } for a in admins]
    })

@app.route('/api/admin/team', methods=['POST'])
@role_required(['admin', 'super_admin'])
# @mfa_required
@audit_log('CREATE_ADMIN', 'USER')
def add_admin():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'phone', 'role_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'All fields are required'}), 400
    
    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    if len(data['password']) < 12:
        return jsonify({'error': 'Password must be at least 12 characters'}), 400
    
    if not re.search(r"[A-Z]", data['password']):
        return jsonify({'error': 'Password must contain at least one uppercase letter'}), 400
    
    if not re.search(r"[a-z]", data['password']):
        return jsonify({'error': 'Password must contain at least one lowercase letter'}), 400
    
    if not re.search(r"\d", data['password']):
        return jsonify({'error': 'Password must contain at least one number'}), 400
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", data['password']):
        return jsonify({'error': 'Password must contain at least one special character'}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Validate role exists
    role = AdminRole.query.get(data['role_id'])
    if not role:
        return jsonify({'error': 'Invalid role'}), 400
    
    # Create user with enhanced security
    user = User(
        full_name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        phone=data['phone'],
        role='admin',
        role_id=data['role_id'],
        is_verified=True,
        force_password_change=True,
        last_password_change=datetime.utcnow()
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Admin created successfully',
        'admin_id': user.id,
        'force_password_change': True
    }), 201

@app.route('/api/admin/roles', methods=['GET'])
@role_required(['admin', 'super_admin'])
# @mfa_required
def list_roles():
    roles = AdminRole.query.all()
    return jsonify([r.to_dict() for r in roles])

@app.route('/api/admin/roles', methods=['POST'])
@role_required(['admin', 'super_admin'])
# @mfa_required
@audit_log('CREATE_ROLE', 'ROLE')
def create_role():
    data = request.get_json()
    
    if not data.get('name') or not isinstance(data.get('permissions', {}), dict):
        return jsonify({'error': 'Name and permissions required'}), 400
    
    # Validate role name
    if AdminRole.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Role already exists'}), 400
    
    # Validate permissions structure
    valid_permissions = {
        'users': ['read', 'write', 'delete'],
        'groups': ['read', 'write', 'delete'],
        'analytics': ['read', 'export'],
        'approvals': ['read', 'approve', 'reject'],
        'support': ['read', 'respond'],
        'team': ['read', 'write', 'delete'],
        'payouts': ['read', 'approve', 'reject'],
        'audit': ['read'],
        'settings': ['read', 'write']
    }
    
    permissions = data.get('permissions', {})
    validated_permissions = {}
    
    for resource, actions in permissions.items():
        if resource in valid_permissions:
            validated_permissions[resource] = {
                action: actions.get(action, False) 
                for action in valid_permissions[resource]
            }
    
    role = AdminRole(
        name=data['name'],
        description=data.get('description', ''),
        permissions=validated_permissions
    )
    
    db.session.add(role)
    db.session.commit()
    
    return jsonify({
        'message': 'Role created successfully',
        'role': role.to_dict()
    }), 201

@app.route('/api/admin/mfa/setup', methods=['POST'])
@role_required(['admin', 'super_admin', 'manager'])
def setup_mfa():
    try:
        token = request.headers.get('Authorization').split(' ')[1]
        payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        user_id = payload.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate TOTP secret
        import pyotp
        secret = pyotp.random_base32()
        
        # Generate backup codes
        import secrets
        backup_codes = [secrets.token_hex(4).upper() for _ in range(10)]
        
        user.mfa_secret = secret
        user.mfa_backup_codes = backup_codes
        
        db.session.commit()
        
        # Generate QR code URL
        totp = pyotp.TOTP(secret)
        qr_url = totp.provisioning_uri(
            name=user.email,
            issuer_name="iStokvel Admin"
        )
        
        return jsonify({
            'secret': secret,
            'qr_url': qr_url,
            'backup_codes': backup_codes
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/mfa/verify', methods=['POST'])
@role_required(['admin', 'super_admin', 'manager'])
def verify_mfa():
    try:
        data = request.get_json()
        token = request.headers.get('Authorization').split(' ')[1]
        payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        user_id = payload.get('user_id')
        user = User.query.get(user_id)
        
        if not user or not user.mfa_enabled:
            return jsonify({'error': 'MFA not enabled'}), 400
        
        # Verify TOTP token
        import pyotp
        totp = pyotp.TOTP(user.mfa_secret)
        
        if not totp.verify(data.get('token')):
            return jsonify({'error': 'Invalid MFA token'}), 400
        
        # Create secure admin session
        session_token = secrets.token_urlsafe(32)
        session = AdminSession(
            user_id=user.id,
            session_token=session_token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            mfa_verified=True,
            expires_at=datetime.utcnow() + timedelta(hours=8)
        )
        
        db.session.add(session)
        db.session.commit()
        
        # Generate new JWT with session info
        new_payload = {
            'user_id': user.id,
            'session_token': session_token,
            'exp': datetime.utcnow() + timedelta(hours=8)
        }
        
        new_token = pyjwt.encode(new_payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'token': new_token,
            'expires_at': session.expires_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/admin/audit-logs', methods=['GET'])
@role_required(['admin', 'super_admin'])
# @mfa_required
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    admin_id = request.args.get('admin_id')
    action = request.args.get('action')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = AdminAuditLog.query
    
    if admin_id:
        query = query.filter(AdminAuditLog.admin_id == admin_id)
    if action:
        query = query.filter(AdminAuditLog.action == action)
    if start_date:
        query = query.filter(AdminAuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AdminAuditLog.created_at <= end_date)
    
    total = query.count()
    logs = query.order_by(AdminAuditLog.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    
    return jsonify({
        'total': total,
        'page': page,
        'limit': limit,
        'logs': [{
            'id': log.id,
            'admin_name': log.admin.full_name if log.admin else 'Unknown',
            'action': log.action,
            'resource_type': log.resource_type,
            'resource_id': log.resource_id,
            'details': log.details,
            'ip_address': log.ip_address,
            'created_at': log.created_at.isoformat()
        } for log in logs]
    })

def super_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401

            token = token.split(' ')[1]
            payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            user_id = payload.get('user_id')
            user = User.query.get(user_id)

            if not user or not user.is_verified:
                return jsonify({'error': 'Unauthorized'}), 401

            # Check if user has super_admin role
            if not user.admin_role or user.admin_role.name != 'super_admin':
                return jsonify({'error': 'Super admin access required'}), 403

            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication failed'}), 401
    return decorated_function

def mfa_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401

            token = token.split(' ')[1]
            payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            user_id = payload.get('user_id')
            user = User.query.get(user_id)

            if not user or not user.is_verified:
                return jsonify({'error': 'Unauthorized'}), 401

            # Check if MFA is enabled and verified for this session
            session_token = payload.get('session_token')
            if session_token:
                session = AdminSession.query.filter_by(
                    session_token=session_token,
                    user_id=user_id
                ).first()
                
                if not session or not session.mfa_verified:
                    return jsonify({'error': 'MFA verification required'}), 403

            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication failed'}), 401
    return decorated_function

def audit_log(action, resource_type=None, resource_id=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Get admin info from token
                token = request.headers.get('Authorization')
                if token:
                    token = token.split(' ')[1]
                    payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                    admin_id = payload.get('user_id')
                    
                    # Create audit log
                    audit_entry = AdminAuditLog(
                        admin_id=admin_id,
                        action=action,
                        resource_type=resource_type,
                        resource_id=str(resource_id) if resource_id else None,
                        details={
                            'method': request.method,
                            'endpoint': request.endpoint,
                            'ip_address': request.remote_addr,
                            'user_agent': request.headers.get('User-Agent')
                        },
                        ip_address=request.remote_addr,
                        user_agent=request.headers.get('User-Agent')
                    )
                    db.session.add(audit_entry)
                    db.session.commit()
                
                return f(*args, **kwargs)
            except Exception as e:
                return f(*args, **kwargs)  # Continue even if audit fails
        return decorated_function
    return decorator

# Add these endpoints after the existing ones

@app.route('/api/admin/roles/<int:role_id>', methods=['PUT'])
@role_required(['admin', 'super_admin'])
# @mfa_required
@audit_log('UPDATE_ROLE', 'ROLE')
def update_role(role_id):
    role = AdminRole.query.get_or_404(role_id)
    data = request.get_json()
    role.name = data.get('name', role.name)
    if 'permissions' in data:
        role.permissions = data['permissions']
    db.session.commit()
    return jsonify({'message': 'Role updated'})

@app.route('/api/admin/roles/<int:role_id>', methods=['DELETE'])
@role_required(['admin', 'super_admin'])
# @mfa_required
@audit_log('DELETE_ROLE', 'ROLE')
def delete_role(role_id):
    role = AdminRole.query.get_or_404(role_id)
    if role.is_system_role:
        return jsonify({'error': 'Cannot delete system role'}), 400
    db.session.delete(role)
    db.session.commit()
    return jsonify({'message': 'Role deleted'})

@app.route('/api/admin/team/<int:admin_id>/role', methods=['PUT'])
@role_required(['admin', 'super_admin'])
# @mfa_required
@audit_log('UPDATE_ADMIN_ROLE', 'USER')
def change_admin_role(admin_id):
    user = User.query.get_or_404(admin_id)
    data = request.get_json()
    role_id = data.get('role_id')
    role = AdminRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Invalid role'}), 400
    user.role_id = role_id
    db.session.commit()
    return jsonify({'message': 'Admin role updated'})

@app.cli.command('create-default-roles')
@with_appcontext
def create_default_roles():
    """Create default admin roles for the stokvel platform"""
    
    # Check if roles already exist
    if AdminRole.query.first():
        print("Roles already exist. Skipping creation.")
        return
    
    roles_data = [
        {
            'name': 'super_admin',
            'description': 'Full system access with ability to manage all admins and roles',
            'is_system_role': True,
            'permissions': {
                'users': {'read': True, 'write': True, 'delete': True},
                'groups': {'read': True, 'write': True, 'delete': True},
                'analytics': {'read': True, 'export': True},
                'approvals': {'read': True, 'approve': True, 'reject': True},
                'support': {'read': True, 'respond': True},
                'team': {'read': True, 'write': True, 'delete': True},
                'payouts': {'read': True, 'approve': True, 'reject': True},
                'audit': {'read': True},
                'settings': {'read': True, 'write': True},
                'financial': {'read': True, 'write': True, 'approve': True},
                'content': {'read': True, 'write': True, 'delete': True},
                'security': {'read': True, 'write': True, 'configure': True}
            }
        },
        {
            'name': 'group_manager',
            'description': 'Manages stokvel groups, members, and group-specific operations',
            'is_system_role': False,
            'permissions': {
                'users': {'read': True, 'write': False, 'delete': False},
                'groups': {'read': True, 'write': True, 'delete': False},
                'analytics': {'read': True, 'export': False},
                'approvals': {'read': True, 'approve': True, 'reject': True},
                'support': {'read': True, 'respond': False},
                'team': {'read': False, 'write': False, 'delete': False},
                'payouts': {'read': True, 'approve': False, 'reject': False},
                'audit': {'read': False},
                'settings': {'read': False, 'write': False},
                'financial': {'read': True, 'write': False, 'approve': False},
                'content': {'read': True, 'write': False, 'delete': False},
                'security': {'read': False, 'write': False, 'configure': False}
            }
        },
        {
            'name': 'financial_admin',
            'description': 'Handles financial operations, withdrawals, and transactions',
            'is_system_role': False,
            'permissions': {
                'users': {'read': True, 'write': False, 'delete': False},
                'groups': {'read': True, 'write': False, 'delete': False},
                'analytics': {'read': True, 'export': True},
                'approvals': {'read': True, 'approve': True, 'reject': True},
                'support': {'read': True, 'respond': False},
                'team': {'read': False, 'write': False, 'delete': False},
                'payouts': {'read': True, 'approve': True, 'reject': True},
                'audit': {'read': True},
                'settings': {'read': False, 'write': False},
                'financial': {'read': True, 'write': True, 'approve': True},
                'content': {'read': False, 'write': False, 'delete': False},
                'security': {'read': False, 'write': False, 'configure': False}
            }
        },
        {
            'name': 'support_admin',
            'description': 'Manages customer support, KYC approvals, and user issues',
            'is_system_role': False,
            'permissions': {
                'users': {'read': True, 'write': True, 'delete': False},
                'groups': {'read': True, 'write': False, 'delete': False},
                'analytics': {'read': False, 'export': False},
                'approvals': {'read': True, 'approve': True, 'reject': True},
                'support': {'read': True, 'respond': True},
                'team': {'read': False, 'write': False, 'delete': False},
                'payouts': {'read': False, 'approve': False, 'reject': False},
                'audit': {'read': False},
                'settings': {'read': False, 'write': False},
                'financial': {'read': False, 'write': False, 'approve': False},
                'content': {'read': True, 'write': False, 'delete': False},
                'security': {'read': False, 'write': False, 'configure': False}
            }
        }
    ]
    
    for role_data in roles_data:
        role = AdminRole(**role_data)
        db.session.add(role)
        print(f"Created role: {role_data['name']}")
    
    db.session.commit()
    print("Default roles created successfully!")


@app.route('/api/admin/initialize-roles', methods=['POST'])
def initialize_default_roles():
    """Initialize default roles for the platform"""
    try:
        # Check if roles already exist
        if AdminRole.query.first():
            return jsonify({'message': 'Roles already exist'}), 200
        
        roles_data = [
            {
                'name': 'super_admin',
                'description': 'Full system access with ability to manage all admins and roles',
                'is_system_role': True,
                'permissions': {
                    'users': {'read': True, 'write': True, 'delete': True},
                    'groups': {'read': True, 'write': True, 'delete': True},
                    'analytics': {'read': True, 'export': True},
                    'approvals': {'read': True, 'approve': True, 'reject': True},
                    'support': {'read': True, 'respond': True},
                    'team': {'read': True, 'write': True, 'delete': True},
                    'payouts': {'read': True, 'approve': True, 'reject': True},
                    'audit': {'read': True},
                    'settings': {'read': True, 'write': True},
                    'financial': {'read': True, 'write': True, 'approve': True},
                    'content': {'read': True, 'write': True, 'delete': True},
                    'security': {'read': True, 'write': True, 'configure': True}
                }
            },
            {
                'name': 'group_manager',
                'description': 'Manages stokvel groups, members, and group-specific operations',
                'is_system_role': False,
                'permissions': {
                    'users': {'read': True, 'write': False, 'delete': False},
                    'groups': {'read': True, 'write': True, 'delete': False},
                    'analytics': {'read': True, 'export': False},
                    'approvals': {'read': True, 'approve': True, 'reject': True},
                    'support': {'read': True, 'respond': False},
                    'team': {'read': False, 'write': False, 'delete': False},
                    'payouts': {'read': True, 'approve': False, 'reject': False},
                    'audit': {'read': False},
                    'settings': {'read': False, 'write': False},
                    'financial': {'read': True, 'write': False, 'approve': False},
                    'content': {'read': True, 'write': False, 'delete': False},
                    'security': {'read': False, 'write': False, 'configure': False}
                }
            },
            {
                'name': 'financial_admin',
                'description': 'Handles financial operations, withdrawals, and transactions',
                'is_system_role': False,
                'permissions': {
                    'users': {'read': True, 'write': False, 'delete': False},
                    'groups': {'read': True, 'write': False, 'delete': False},
                    'analytics': {'read': True, 'export': True},
                    'approvals': {'read': True, 'approve': True, 'reject': True},
                    'support': {'read': True, 'respond': False},
                    'team': {'read': False, 'write': False, 'delete': False},
                    'payouts': {'read': True, 'approve': True, 'reject': True},
                    'audit': {'read': True},
                    'settings': {'read': False, 'write': False},
                    'financial': {'read': True, 'write': True, 'approve': True},
                    'content': {'read': False, 'write': False, 'delete': False},
                    'security': {'read': False, 'write': False, 'configure': False}
                }
            },
            {
                'name': 'support_admin',
                'description': 'Manages customer support, KYC approvals, and user issues',
                'is_system_role': False,
                'permissions': {
                    'users': {'read': True, 'write': True, 'delete': False},
                    'groups': {'read': True, 'write': False, 'delete': False},
                    'analytics': {'read': False, 'export': False},
                    'approvals': {'read': True, 'approve': True, 'reject': True},
                    'support': {'read': True, 'respond': True},
                    'team': {'read': False, 'write': False, 'delete': False},
                    'payouts': {'read': False, 'approve': False, 'reject': False},
                    'audit': {'read': False},
                    'settings': {'read': False, 'write': False},
                    'financial': {'read': False, 'write': False, 'approve': False},
                    'content': {'read': True, 'write': False, 'delete': False},
                    'security': {'read': False, 'write': False, 'configure': False}
                }
            }
        ]
        
        for role_data in roles_data:
            role = AdminRole(**role_data)
            db.session.add(role)
        
        db.session.commit()
        return jsonify({'message': 'Default roles created successfully'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@app.route('/admin/analytics/overview', methods=['GET'])
@admin_required
def admin_analytics_overview():
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    # Optional filters
    start_date_str = request.args.get('start_date')  # format: YYYY-MM-DD
    end_date_str = request.args.get('end_date')
    user_id = request.args.get('user_id')
    group_id = request.args.get('group_id')

    # Parse date filters
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else thirty_days_ago
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else now
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    # User Stats (global only)
    total_users = db.session.query(func.count(User.id)).scalar()
    verified_users = db.session.query(func.count(User.id)).filter(User.is_verified == True).scalar()
    recent_users = db.session.query(func.count(User.id)).filter(User.created_at >= (now - timedelta(days=7))).scalar()

    # Sessions (only count active sessions in the last 24 hours)
    recent_window = datetime.utcnow() - timedelta(hours=24)
    session_query = db.session.query(UserSession).filter(UserSession.login_time.between(start_date, end_date))
    if user_id:
        session_query = session_query.filter(UserSession.user_id == user_id)
    total_sessions = session_query.count()
    active_sessions = session_query.filter(
        UserSession.is_active == True,
        UserSession.last_activity >= recent_window
    ).count()

    # Transactions
    txn_query = db.session.query(Transaction).filter(Transaction.created_at.between(start_date, end_date))
    if user_id:
        txn_query = txn_query.filter(Transaction.user_id == user_id)
    total_transactions = txn_query.count()
    completed_txns = txn_query.filter(Transaction.status == 'completed')
    completed_count = completed_txns.count()
    total_volume = completed_txns.with_entities(func.sum(Transaction.amount)).scalar() or 0

    txn_volume_by_type = completed_txns.with_entities(
        Transaction.transaction_type,
        func.sum(Transaction.amount)
    ).group_by(Transaction.transaction_type).all()

    txn_daily_volume = completed_txns.with_entities(
        func.date(Transaction.created_at),
        func.sum(Transaction.amount)
    ).group_by(func.date(Transaction.created_at)).order_by(func.date(Transaction.created_at)).all()

    # Contributions
    contrib_query = db.session.query(Contribution).join(StokvelMember)
    if group_id:
        contrib_query = contrib_query.filter(StokvelMember.group_id == group_id)
    if user_id:
        contrib_query = contrib_query.filter(StokvelMember.user_id == user_id)
    contrib_query = contrib_query.filter(Contribution.date.between(start_date, end_date))
    total_contributions = contrib_query.count()
    contribution_volume = contrib_query.with_entities(func.sum(Contribution.amount)).scalar() or 0

    # Referrals
    referral_query = db.session.query(Referral).filter(Referral.created_at.between(start_date, end_date))
    if user_id:
        referral_query = referral_query.filter((Referral.referrer_id == user_id) | (Referral.referee_id == user_id))
    total_referrals = referral_query.count()
    completed_referrals = referral_query.filter(Referral.status == 'completed').count()

    # Chat
    message_query = db.session.query(Message).filter(Message.created_at.between(start_date, end_date))
    if user_id:
        message_query = message_query.join(Conversation).filter(Conversation.user_id == user_id)
    total_messages = message_query.count()
    assistant_messages = message_query.filter(Message.role == 'assistant').count()
    user_messages = total_messages - assistant_messages

    # Notifications
    notif_query = db.session.query(Notification).filter(Notification.created_at.between(start_date, end_date))
    if user_id:
        notif_query = notif_query.filter(Notification.user_id == user_id)
    unread_notifications = notif_query.filter(Notification.is_read == False).count()

    # Top stokvel groups (not affected by filters)
    top_groups = db.session.query(
        StokvelGroup.name,
        func.count(StokvelGroup.members)
    ).group_by(StokvelGroup.id).order_by(func.count(StokvelGroup.members).desc()).limit(5).all()

    return jsonify({
        "filters": {
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": end_date.strftime('%Y-%m-%d'),
            "user_id": user_id,
            "group_id": group_id
        },
        "user_stats": {
            "total": total_users,
            "verified": verified_users,
            "recent_last_7_days": recent_users
        },
        "sessions": {
            "total": total_sessions,
            "active": active_sessions
        },
        "transactions": {
            "total": total_transactions,
            "completed": completed_count,
            "volume": float(total_volume),
            "volume_by_type": {t[0]: float(t[1]) for t in txn_volume_by_type},
            "daily_volume": [{"date": str(t[0]), "amount": float(t[1])} for t in txn_daily_volume]
        },
        "contributions": {
            "total": total_contributions,
            "volume": float(contribution_volume)
        },
        "referrals": {
            "total": total_referrals,
            "completed": completed_referrals
        },
        "chat": {
            "total_messages": total_messages,
            "user": user_messages,
            "assistant": assistant_messages
        },
        "notifications": {
            "unread": unread_notifications
        },
        "top_stokvel_groups": [
            {"name": g[0], "members": g[1]} for g in top_groups
        ]
    }), 200


@app.route('/api/admin/faqs', methods=['GET'])
@role_required(['admin'])
def get_faqs():
    category = request.args.get('category')
    published = request.args.get('published')
    search = request.args.get('search')
    query = FAQ.query
    if category:
        query = query.filter(FAQ.category == category)
    if published is not None:
        if published.lower() == 'true':
            query = query.filter(FAQ.is_published.is_(True))
        elif published.lower() == 'false':
            query = query.filter(FAQ.is_published.is_(False))
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(FAQ.question.ilike(like), FAQ.answer.ilike(like))
        )
    faqs = query.order_by(FAQ.created_at.desc()).all()
    return jsonify([faq.to_dict() for faq in faqs]), 200

@app.route('/api/admin/faqs', methods=['POST'])
@role_required(['admin'])
def create_faq():
    data = request.get_json()
    faq = FAQ(
        question=data.get('question'),
        answer=data.get('answer'),
        category=data.get('category'),
        is_published=data.get('is_published', True)
    )
    db.session.add(faq)
    db.session.commit()
    return jsonify({'message': 'FAQ created', 'faq': faq.to_dict()}), 201

@app.route('/api/admin/withdrawals/<int:withdrawal_id>/approve', methods=['POST'])
@role_required(['admin'])
def approve_withdrawal(withdrawal_id):
    withdrawal = WithdrawalRequest.query.get_or_404(withdrawal_id)
    if withdrawal.status != 'pending':
        return jsonify({'error': 'Request is not pending'}), 400
    withdrawal.status = 'approved'
    db.session.commit()
    # Optionally send notification to user
    member = withdrawal.member
    user = User.query.get(member.user_id) if member else None
    if user:
        notification = Notification(
            user_id=user.id,
            title="Payout Approved",
            message=f"Your payout request for R{withdrawal.amount:.2f} has been approved.",
            type="payout_approved",
            data={"withdrawal_id": withdrawal.id}
        )
        db.session.add(notification)
        db.session.commit()
    return jsonify({'message': 'Withdrawal request approved'}), 200

@app.route('/api/admin/withdrawals/<int:withdrawal_id>/reject', methods=['POST'])
@role_required(['admin'])
def reject_withdrawal(withdrawal_id):
    withdrawal = WithdrawalRequest.query.get_or_404(withdrawal_id)
    if withdrawal.status != 'pending':
        return jsonify({'error': 'Request is not pending'}), 400
    data = request.get_json() or {}
    reason = data.get('reason', '')
    withdrawal.status = 'rejected'
    withdrawal.reason = reason
    db.session.commit()
    # Optionally send notification to user
    member = withdrawal.member
    user = User.query.get(member.user_id) if member else None
    if user:
        notification = Notification(
            user_id=user.id,
            title="Payout Rejected",
            message=f"Your payout request for R{withdrawal.amount:.2f} was rejected. Reason: {reason}",
            type="payout_rejected",
            data={"withdrawal_id": withdrawal.id, "reason": reason}
        )
        db.session.add(notification)
        db.session.commit()
    return jsonify({'message': 'Withdrawal request rejected'}), 200




# ----------------------------------------------------------------------------------------------------Notifications
@app.route('/api/user/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'data': n.data,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications])

@app.route('/api/user/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    
    if notification:
        notification.is_read = True
        db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})

@app.route('/api/user/notifications/mark-as-read', methods=['POST'])
@token_required
def mark_notifications_as_read(current_user):
    return jsonify({'message': 'Not implemented'}), 501

# Send notification to user
@app.route('/api/notifications/send', methods=['POST'])
@jwt_required()
def send_notification():
    data = request.get_json()
    user_id = data.get("userId")
    message = data.get("message")
    # You can use your Notification model or any notification logic here
    notification = Notification(
        user_id=user_id,
        title="Beneficiary Status Update",
        message=message,
        type="beneficiary"
    )
    db.session.add(notification)
    db.session.commit()
    return jsonify({"message": "Notification sent"})

def get_status(b):
    if b.status in ["Approved", "Rejected"]:
        return b.status
    if not (b.id_doc_url or b.address_doc_url or b.relationship_doc_url):
        return "No Documents"
    return "Pending"

#------------------------------------------------------------------------------------ Points and rewards
REWARD_CATALOG = {
    'airtime_10': {'points': 100, 'description': 'R10 Airtime or Mobile Data'},
    'voucher_50': {'points': 500, 'description': 'R50 Grocery Voucher'},
    'credit_100': {'points': 1000, 'description': 'R100 Wallet Credit'},
}

@app.route('/api/user/points/rewards', methods=['GET'])
@token_required
def get_rewards_catalog(current_user):
    return jsonify(REWARD_CATALOG)

@app.route('/api/user/points/redeem', methods=['POST'])
@token_required
def redeem_points(current_user):
    data = request.get_json()
    reward_key = data.get('reward_key')
    if not reward_key or reward_key not in REWARD_CATALOG:
        return jsonify({'error': 'Invalid or missing reward_key.'}), 400
    reward = REWARD_CATALOG[reward_key]
    required_points = reward['points']
    if current_user.points < required_points:
        return jsonify({
            'error': 'Insufficient points for this reward.',
            'current_points': current_user.points,
            'required_points': required_points
        }), 400
    current_user.points -= required_points
    db.session.commit()
    return jsonify({
        'message': 'Reward redeemed successfully!',
        'reward_received': reward['description'],
        'new_points_balance': current_user.points
    }), 200
    
#---------------------------------------------------------------------Contact
    
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')
    user_id = None
    try:
        user_id = get_jwt_identity()
    except Exception:
        pass
    if not all([name, email, subject, message]):
        return jsonify({'error': 'All fields are required.'}), 400
    concern = CustomerConcern(
        user_id=user_id,
        name=name,
        email=email,
        subject=subject,
        message=message
    )
    db.session.add(concern)
    db.session.commit()
    return jsonify({'message': 'Your message has been received. Thank you for contacting us!'}), 201


# ---------------------------------------------------------------------------------------------------Chat routes
@app.route('/api/start', methods=['POST'])
@token_required
def start_chat(current_user):
    data = request.get_json() or {}
    title = data.get('title', 'New Chat')
    is_stokvel_related = data.get('is_stokvel_related', False)
    stokvel_id = data.get('stokvel_id')

    conversation = Conversation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=title,
        is_stokvel_related=is_stokvel_related,
        stokvel_id=stokvel_id
    )
    db.session.add(conversation)
    db.session.commit()

    # Add system message
    system_message = Message(
        conversation_id=conversation.id,
        role='system',
        content='You are a helpful assistant. Answer concisely in 1-3 sentences.'
    )
    db.session.add(system_message)
    db.session.commit()

    return jsonify({"conversation_id": conversation.id}), 201

@app.route('/api/message', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    conversation_id = data.get('conversation_id')
    user_message = data.get('message')

    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    if not conversation:
        return jsonify({"error": "Conversation not found."}), 404

    # Add user message
    user_msg = Message(
        conversation_id=conversation_id,
        role='user',
        content=user_message
    )
    db.session.add(user_msg)
    db.session.commit()

    # Fetch all messages for OpenAI context
    messages = [
        {"role": m.role, "content": m.content}
        for m in Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at).all()
    ]

    # Call OpenRouter API
    try:
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": os.getenv('FRONTEND_URL', 'http://localhost:3000'),
                "X-Title": "Stokvel Assistant",
            },
            model="meta-llama/llama-3-8b-instruct",
            messages=messages,
            max_tokens=150
        )
        ai_response = completion.choices[0].message.content

        # Store AI response
        assistant_msg = Message(
            conversation_id=conversation_id,
            role='assistant',
            content=ai_response
        )
        db.session.add(assistant_msg)
        db.session.commit()

        return jsonify({
            "response": ai_response,
            "conversation_id": conversation_id
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    about_us_text = """
    Welcome to our service! We provide a secure and user-friendly digital wallet solution. 
    Feel free to ask me any questions about our platform.
    """

    data = request.get_json()
    user_message = data.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        api_key = os.getenv('OPENROUTER_API_KEY')
        if not api_key:
            return jsonify({'error': 'OpenRouter API key not set'}), 500

        payload = {
            "model": "deepseek/deepseek-r1-distill-llama-70b:free",
            "messages": [
                {"role": "system", "content": about_us_text},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 150
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers
        )
        if response.status_code != 200:
            print("OpenRouter error:", response.text)
            return jsonify({'error': f'OpenRouter error: {response.text}'}), 500

        data = response.json()
        answer = data['choices'][0]['message']['content']
        return jsonify({'answer': answer})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ------------------------------------------------------------------------------------------------------ routes
@app.route('/api/test-email', methods=['POST'])
def test_email():
    """Test endpoint to verify email configuration"""
    try:
        data = request.get_json()
        test_email = data.get('email')
        
        if not test_email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check configuration
        if not check_email_config():
            return jsonify({'error': 'Email configuration is incomplete'}), 500
        
        # Send test email
        test_code = '123456'
        success, message = send_verification_email(test_email, test_code)
        
        if success:
            return jsonify({'message': 'Test email sent successfully', 'details': message}), 200
        else:
            return jsonify({'error': f'Failed to send test email: {message}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Test email failed: {str(e)}'}), 500

@app.route('/api/test-users', methods=['GET'])
def test_users():
    try:
        users = User.query.all()
        return jsonify({
            'count': len(users),
            'users': [{'id': user.id, 'email': user.email} for user in users]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-all-users', methods=['GET'])
def delete_all_users():
    try:
        # Delete all OTPs first
        OTP.query.delete()
        # Then delete all users
        User.query.delete()
        db.session.commit()
        return jsonify({'message': 'All users and OTPs deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

#---------------------------------------------------------------------------------- File serving routes


@app.route('/uploads/kyc_docs/<filename>')
def serve_kyc_doc(filename):
    return send_from_directory(KYC_UPLOAD_FOLDER, filename)

#--------------------------------------------------------------------------------------------------------- CLI Commands

@app.cli.command('create-default-groups')
def create_default_groups():
    default_groups = [
        {'name': 'Savings Bronze', 'category': 'savings', 'tier': 'Bronze', 'contribution_amount': 200, 'frequency': 'monthly', 'max_members': 50},
        # ... add the rest ...
    ]
    for group_data in default_groups:
        existing = StokvelGroup.query.filter_by(
            category=group_data['category'], 
            tier=group_data['tier']
        ).first()
        if not existing:
            group = StokvelGroup(**group_data)
            db.session.add(group)
            print(f"Created: {group_data['name']}")
    db.session.commit()
    print("Default groups created successfully!")

@app.cli.command('init-db')
@with_appcontext
def init_db():
    db.create_all()
    click.echo('Initialized the database.')

@app.cli.command('create-admin')
@with_appcontext
def create_admin():
    """Creates a new admin user."""
    email = click.prompt('Enter admin email', type=str)
    password = click.prompt('Enter admin password', type=str, hide_input=True, confirmation_prompt=True)
    full_name = click.prompt('Enter admin full name', type=str, default='Admin User')
    phone = click.prompt('Enter admin phone number', type=str)

    if User.query.filter_by(email=email).first():
        click.echo(click.style(f"Error: Email '{email}' already exists.", fg='red'))
        return
        
    if User.query.filter_by(phone=phone).first():
        click.echo(click.style(f"Error: Phone number '{phone}' already exists.", fg='red'))
        return

    admin = User(
        email=email,
        full_name=full_name,
        phone=phone,
        role='admin',
        is_verified=True # Admins should be verified by default
    )
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    click.echo(click.style(f"Admin user '{full_name}' created successfully with email '{email}'.", fg='green'))

@app.cli.command('reset-db')
@with_appcontext
def reset_db():
    db.drop_all()
    db.create_all()
    click.echo(click.style('Database has been reset.', fg='green'))

@app.cli.command('reset-users')
@with_appcontext
def reset_users():
    """Delete all users and their related data from the database"""
    try:
        # Delete in order of dependencies (child tables first)
        
        # Delete messages (depends on conversations)
        Message.query.delete()
        
        # Delete conversations (depends on users and stokvel_groups)
        Conversation.query.delete()
        
        # Delete withdrawal requests (depends on stokvel_members)
        WithdrawalRequest.query.delete()
        
        # Delete contributions (depends on stokvel_members)
        Contribution.query.delete()
        
        # Delete stokvel members (depends on users and stokvel_groups)
        StokvelMember.query.delete()
        
        # Delete polls and poll options (depends on stokvel_groups)
        PollOption.query.delete()
        Poll.query.delete()
        
        # Delete meetings (depends on stokvel_groups)
        Meeting.query.delete()
        
        # Delete stokvel groups (depends on users via admin_id)
        StokvelGroup.query.delete()
        
        # Delete KYC verifications (depends on users)
        KYCVerification.query.delete()
        
        # Delete user sessions (depends on users)
        UserSession.query.delete()
        
        # Delete OTPs (depends on users)
        OTP.query.delete()
        
        # Delete wallets (depends on users)
        Wallet.query.delete()
        
        # Delete notification settings (depends on users)
        NotificationSettings.query.delete()
        
        # Delete user preferences (depends on users)
        UserPreferences.query.delete()
        
        # Finally delete all users
        User.query.delete()
        
        db.session.commit()
        print('All users and related data deleted successfully')
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')

@app.cli.command('generate-account-numbers')
@with_appcontext
def generate_account_numbers():
    """Generate account numbers for all users who don't have them"""
    try:
        users_without_account = User.query.filter_by(account_number=None).all()
        
        if not users_without_account:
            print("✅ All users already have account numbers!")
            return
        
        for user in users_without_account:
            user.account_number = generate_account_number()
            print(f"✅ Generated account number {user.account_number} for user {user.id} ({user.email})")
        
        db.session.commit()
        print(f"✅ Generated account numbers for {len(users_without_account)} users")
    except Exception as e:
        print(f"❌ Error generating account numbers: {str(e)}")
        db.session.rollback()

@app.cli.command('add-test-card')
@with_appcontext
def add_test_card():
    """Add a test card for development"""
    email = click.prompt('Enter user email to add test card for', type=str)
    
    user = User.query.filter_by(email=email).first()
    if not user:
        click.echo(click.style(f"Error: User with email '{email}' not found.", fg='red'))
        return
    
    # Check if test card already exists
    existing_card = Card.query.filter_by(user_id=user.id, card_number_last4='1234').first()
    if existing_card:
        click.echo(click.style(f"Test card already exists for user '{email}'.", fg='yellow'))
        return
    
    test_card = Card(
        user_id=user.id,
        cardholder="Bongiwe M",  # Changed from "Test User"
        card_number_last4="1234",
        expiry="12/25",
        is_primary=True
    )
    
    db.session.add(test_card)
    db.session.commit()
    
    click.echo(click.style(f"Test card added successfully for user '{email}'.", fg='green'))
    click.echo(f"Card Details: Visa ****1234, Expires: 12/25")

@app.cli.command('update-test-card-name')
@with_appcontext
def update_test_card_name():
    """Update existing test card name to Bongiwe M"""
    email = click.prompt('Enter user email to update test card for', type=str)
    
    user = User.query.filter_by(email=email).first()
    if not user:
        click.echo(click.style(f"Error: User with email '{email}' not found.", fg='red'))
        return
    
    # Find the test card
    test_card = Card.query.filter_by(user_id=user.id, card_number_last4='1234').first()
    if not test_card:
        click.echo(click.style(f"No test card found for user '{email}'.", fg='yellow'))
        return
    
    # Update the cardholder name
    test_card.cardholder = "Bongiwe M"
    db.session.commit()
    
    click.echo(click.style(f"Test card updated successfully for user '{email}'.", fg='green'))
    click.echo(f"Card Details: {test_card.cardholder} - Visa ****{test_card.card_number_last4}, Expires: {test_card.expiry}")

# Test endpoint for adding test card
@app.route('/api/test/add-test-card', methods=['POST'])
@token_required
def add_test_card_api(current_user):
    """Temporary endpoint to add test card - REMOVE IN PRODUCTION"""
    try:
        # Check if test card already exists
        existing_card = Card.query.filter_by(user_id=current_user.id, card_number_last4='1234').first()
        if existing_card:
            return jsonify({'message': 'Test card already exists', 'card': existing_card.to_dict()}), 200
        
        # Unset other primary cards
        Card.query.filter_by(user_id=current_user.id, is_primary=True).update({'is_primary': False})
        
        test_card = Card(
            user_id=current_user.id,
            cardholder="Bongiwe M",  # Changed from current_user.full_name
            card_number_last4="1234",
            expiry="12/25",
            is_primary=True
        )
        
        db.session.add(test_card)
        db.session.commit()
        
        return jsonify({
            'message': 'Test card added successfully',
            'card': test_card.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
#------------------------------------------------------------------------------------------------------ Claims routes
fraud_detector = FraudDetector()


@app.route('/api/claims', methods=['POST'])
@token_required
def create_claim(current_user):
    try:
        data = request.form.to_dict()
        files = request.files
        
        # Validate required fields
        required_fields = ['amount', 'reason']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate files
        required_files = ['id_document', 'death_certificate', 'proof_of_residence']
        for file_field in required_files:
            if file_field not in files:
                return jsonify({'error': f'Missing required file: {file_field}'}), 400
        
        # Save files
        def save_file(file_field):
            file = files.get(file_field)
            if file:
                filename = secure_filename(f"claim_{current_user.id}_{file_field}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                return file_path
            return None
        
        # Create claim
        claim = Claim(
            user_id=current_user.id,
            amount=float(data['amount']),
            reason=data['reason'],
            beneficiary_id=data.get('beneficiary_id'),
            id_document_path=save_file('id_document'),
            death_certificate_path=save_file('death_certificate'),
            proof_of_residence_path=save_file('proof_of_residence')
        )
        
        # Save additional documents
        additional_docs = []
        for i in range(1, 6):
            if file := files.get(f'additional_doc_{i}'):
                path = save_file(f'additional_doc_{i}')
                additional_docs.append(path)
        
        if additional_docs:
            claim.additional_documents_path = json.dumps(additional_docs)
        
        db.session.add(claim)
        db.session.flush()  # Get claim ID before commit
        
        # Fraud Detection
        past_claims = db.session.query(Claim).filter_by(user_id=current_user.id).count()
        
        # 1. Rule-based checks
        fraud_indicators = fraud_detector.rule_based_checks(claim, db)
        
        # 2. Document analysis
        for doc_field in ['id_document_path', 'death_certificate_path']:
            if doc_path := getattr(claim, doc_field):
                if issue := fraud_detector.check_document(doc_path):
                    fraud_indicators.append(f"{doc_field}: {issue}")
        
        # 3. ML Prediction
        fraud_score = fraud_detector.predict_fraud(claim.amount, past_claims)
        claim.fraud_score = fraud_score
        claim.fraud_indicators = json.dumps(fraud_indicators)
        
        # Set status
        claim.status = 'review' if fraud_score > 0.7 or fraud_indicators else 'pending'
        
        # Notify admin
        if current_user.role != 'admin':
            admin = db.session.query(User).filter_by(role='admin').first()
            if admin:
                notification = Notification(
                    user_id=admin.id,
                    title="New Claim Submitted",
                    message=f"Claim #{claim.id} from {current_user.full_name} (Score: {fraud_score:.2f})",
                    type="new_claim",
                    data=json.dumps({"claim_id": claim.id, "fraud_score": fraud_score})
                )
                db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Claim submitted',
            'claim_id': claim.id,
            'fraud_score': fraud_score,
            'status': claim.status
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/claims/<int:claim_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_claim(current_user, claim_id):
    claim = db.session.get(Claim, claim_id)
    if not claim:
        return jsonify({'error': 'Claim not found'}), 404
    
    if claim.status == 'approved':
        return jsonify({'error': 'Claim already approved'}), 400
    
    # In a real app, you would process payment here
    claim.status = 'approved'
    claim.updated_at = datetime.utcnow()
    
    # Notify user
    notification = Notification(
        user_id=claim.user_id,
        title="Claim Approved",
        message=f"Your claim for R{claim.amount} has been approved",
        type="claim_approved"
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Claim approved'})

@app.route('/api/claims/documents/<filename>', methods=['GET'])
@token_required
def download_document(current_user, filename):
    if not filename.startswith(f'claim_{current_user.id}_') and current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath, as_attachment=True)

#------------------------------------------------------------------------------------------------------ Beneficiaries routes
@app.route('/api/beneficiaries', methods=['POST'])
@jwt_required()
def add_beneficiary():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    id_number = data.get('id_number')
    relationship = data.get('relationship')
    date_of_birth = data.get('date_of_birth')
    phone = data.get('phone')
    email = data.get('email')
    if not name:
        return jsonify({"error": "Name is required"}), 400
    beneficiary = Beneficiary(
        user_id=user_id,
        name=name,
        id_number=id_number,
        relationship=relationship,
        date_of_birth=date_of_birth,
        phone=phone,
        email=email
    )
    db.session.add(beneficiary)
    db.session.commit()
    return jsonify({"message": "Beneficiary added", "id": beneficiary.id}), 201

@app.route('/api/beneficiaries/<int:beneficiary_id>', methods=['PUT'])
@jwt_required()
def edit_beneficiary(beneficiary_id):
    user_id = get_jwt_identity()
    beneficiary = Beneficiary.query.filter_by(id=beneficiary_id, user_id=user_id).first()
    if not beneficiary:
        return jsonify({"error": "Beneficiary not found"}), 404
    data = request.get_json()
    beneficiary.name = data.get('name', beneficiary.name)
    beneficiary.id_number = data.get('id_number', beneficiary.id_number)
    beneficiary.relationship = data.get('relationship', beneficiary.relationship)
    beneficiary.date_of_birth = data.get('date_of_birth', beneficiary.date_of_birth)
    beneficiary.phone = data.get('phone', beneficiary.phone)
    beneficiary.email = data.get('email', beneficiary.email)
    db.session.commit()
    return jsonify({"message": "Beneficiary updated"})

@app.route('/api/beneficiaries', methods=['GET'])
@jwt_required()
def get_beneficiaries():
    user_id = get_jwt_identity()
    beneficiaries = Beneficiary.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": b.id,
        "name": b.name,
        "id_number": b.id_number,
        "relationship": b.relationship,
        "phone": b.phone,
        "email": b.email,
        "date_of_birth": b.date_of_birth,
        "created_at": b.created_at,
        "id_doc_url": b.id_doc_url,
        "address_doc_url": b.address_doc_url,
        "relationship_doc_url": b.relationship_doc_url,
    } for b in beneficiaries])

@app.route('/api/beneficiaries/<int:beneficiary_id>', methods=['DELETE'])
@jwt_required()
def delete_beneficiary(beneficiary_id):
    user_id = get_jwt_identity()
    beneficiary = Beneficiary.query.filter_by(id=beneficiary_id, user_id=user_id).first()
    if not beneficiary:
        return jsonify({"error": "Beneficiary not found"}), 404
    db.session.delete(beneficiary)
    db.session.commit()
    return jsonify({"message": "Beneficiary deleted"}), 200


@app.route('/api/beneficiaries/<int:beneficiary_id>/documents', methods=['POST'])
@jwt_required()
def upload_beneficiary_document(beneficiary_id):
    beneficiary = Beneficiary.query.get_or_404(beneficiary_id)
    file = request.files.get('file')
    doc_type = request.form.get('type')
    if not file or not doc_type:
        return jsonify({'error': 'Missing file or type'}), 400

    upload_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'uploads', 'beneficiary_docs'))
    os.makedirs(upload_folder, exist_ok=True)
    filename = f"{beneficiary_id}_{doc_type}_{secure_filename(file.filename)}"
    save_path = os.path.join(upload_folder, filename)
    print("Saving file to:", save_path)
    file.save(save_path)

    url = f"http://localhost:5001/uploads/beneficiary_docs/{filename}"
    if doc_type == 'id':
        beneficiary.id_doc_url = url
    elif doc_type == 'address':
        beneficiary.address_doc_url = url
    elif doc_type == 'relationship':
        beneficiary.relationship_doc_url = url
    else:
        return jsonify({'error': 'Invalid document type'}), 400

    db.session.commit()
    return jsonify({'url': url}), 200

@app.route('/uploads/beneficiary_docs/<filename>')
def serve_beneficiary_doc(filename):
    upload_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'uploads', 'beneficiary_docs'))
    return send_from_directory(upload_folder, filename)

#------------------------------------------------------------------------------------------------------ Market routes
@app.route('/market/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    txns = MarketTransaction.query.filter_by(user_id=user_id).order_by(MarketTransaction.timestamp.desc()).all()
    return jsonify([{
        "id": t.id,
        "item_type": t.item_type,
        "provider": t.provider,
        "amount": t.amount,
        "payment_method": t.payment_method,
        "status": t.status,
        "timestamp": t.timestamp.isoformat(),
        "reference": t.reference
    } for t in txns])


@app.route('/market/purchase', methods=['POST'])
@jwt_required()
def purchase():
    user_id = get_jwt_identity()
    data = request.json

    item_type = data.get('item_type')
    provider = data.get('provider')
    amount = data.get('amount')
    payment_method = data.get('payment_method')
    card_id = data.get('card_id')

    if not all([item_type, provider, amount, payment_method]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount format"}), 400

    # --- Digital Wallet ---
    if payment_method == "wallet":
        wallet = Wallet.query.filter_by(user_id=user_id).first()
        if not wallet:
            return jsonify({"error": "Wallet not found"}), 404
        if wallet.balance < amount:
            return jsonify({"error": "Insufficient wallet balance"}), 400
        wallet.balance -= amount

    # --- Card Payment ---
    elif payment_method == "card":
        card = Card.query.filter_by(id=card_id, user_id=user_id).first()
        if not card:
            return jsonify({"error": "Card not found"}), 404
        # Simulate card payment
        print(f"Charging card **** **** **** {card.card_number_last4} for R{amount}")
    else:
        return jsonify({"error": "Invalid payment method"}), 400

    # --- Record Transaction ---
    txn = MarketTransaction(
        user_id=user_id,
        item_type=item_type,
        provider=provider,
        amount=amount,
        payment_method=payment_method,
        status='successful',
        reference=generate_reference()
    )
    db.session.add(txn)
    db.session.commit()

    # --- Send Notification (optional) ---
    send_notification(user_id, f"Your purchase of {item_type} for R{amount} was successful.")

    return jsonify({"message": "Purchase successful!", "reference": txn.reference}), 200

def generate_reference():
    return f"TXN-{uuid.uuid4().hex[:12]}"

def send_notification(user_id, message):
    # Replace with actual notification logic (email, SMS, push etc.)
    print(f"Notification to user {user_id}: {message}")
    
#------------------------------------------------------------------------------------------------------ Savings goals routes
@app.route('/api/user/savings-goal', methods=['GET'])
@token_required
def get_savings_goal(current_user):
    goal = SavingsGoal.query.filter_by(user_id=current_user.id).order_by(SavingsGoal.created_at.desc()).first()
    if not goal:
        return jsonify({'label': '', 'target': 0, 'progress': 0})
    # Calculate progress as sum of all contributions
    from sqlalchemy import func
    progress = db.session.query(func.sum(Contribution.amount)) \
        .join(StokvelMember) \
        .filter(StokvelMember.user_id == current_user.id) \
        .scalar() or 0.0
    return jsonify({
        'label': goal.label,
        'target': goal.target,
        'progress': float(progress)
    })

@app.route('/api/user/savings-goal', methods=['POST'])
@token_required
def set_savings_goal(current_user):
    data = request.get_json()
    label = data.get('label')
    target = data.get('target')
    if not label or not target:
        return jsonify({'error': 'Label and target are required.'}), 400
    goal = SavingsGoal(user_id=current_user.id, label=label, target=target)
    db.session.add(goal)
    db.session.commit()
    return jsonify({'message': 'Savings goal set successfully.'}), 201



#------------------------------------------------------------------------------------------------------ Error handlers
@app.errorhandler(Exception)
def handle_error(error):
    # Let Flask handle HTTP errors (like 404, 405, etc.) with its default pages
    if isinstance(error, HTTPException):
        return error

    logger.error(f"Unhandled error: {str(error)}")
    if isinstance(error, SQLAlchemyError):
        db.session.rollback()
        return jsonify({"error": "Database error occurred"}), 500
    if isinstance(error, (ExpiredSignatureError, InvalidTokenError)):
        return jsonify({"error": "Token has expired"}), 401
    return jsonify({"error": "An unexpected error occurred"}), 500

#------------------------------------------------------------------------------------------------------ Before request handler
@app.before_request
def handle_options_requests():
    if request.method == 'OPTIONS':
        return '', 200

#------------------------------------------------------------------------------------------------------ Database event listeners
@event.listens_for(Engine, "connect")
def connect(dbapi_connection, connection_record):
    connection_record.info['pid'] = os.getpid()

@event.listens_for(Engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    pid = os.getpid()
    if connection_record.info['pid'] != pid:
        connection_record.info['pid'] = pid
        connection_record.info['checked_out'] = time.time()

#------------------------------------------------------------------------------------------------------ MAIN --------------------
if __name__ == '__main__':
    app.run(port=5001, debug=True)
