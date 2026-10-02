"""Isolated API regression checks; no production database or provider calls."""
import copy
import os
import secrets
import unittest

os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['AUTH_SECRET_KEY'] = secrets.token_hex(32)

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.database import Base
from app.api import auth, question_builder as qb
from app.models.user import User
from app.services import auth_service


class ReadinessTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        def db():
            with self.sessions() as session:
                yield session
        app = FastAPI()
        app.include_router(auth.router)
        app.include_router(qb.router)
        app.dependency_overrides[auth_service.get_db] = db
        app.dependency_overrides[qb.get_db] = db
        self.client = TestClient(app)
        self.headers = {}
        with self.sessions() as session:
            for name, role, project in [('owner', 'Ahli Panel Pembangun', 'P1'), ('peer', 'Ahli Panel Pembangun', 'P1'), ('other', 'Ahli Panel Pembangun', 'P2'), ('admin', 'Super Admin', 'P1')]:
                user = User(email=name+'@test.local', name=name, role=role, project_ref=project, password_hash=auth_service.hash_password('Unique-test-password-42'), is_active=True)
                session.add(user)
                session.flush()
                self.headers[name] = {'Authorization': 'Bearer '+auth_service.create_access_token(user)}
            session.commit()
        self.question = {'id': 'q1', 'type': 'Objektif', 'skillCategory': 'Prosedur', 'difficulty': 'Aras Rendah', 'question': 'Which step is correct?', 'options': ['A. One', 'B. Two', 'C. Three', 'D. Four'], 'correctAnswer': 'B', 'sourceReference': 'Section 1', 'answerScheme': ['Two'], 'locked': False}
        self.payload = {'title': 'Test', 'settings': {}, 'questions': [self.question], 'visibility': 'Private'}

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def test_private_project_access_and_round_trip(self):
        self.assertEqual(self.client.get('/question-builder/drafts').status_code, 401)
        saved = self.client.post('/question-builder/drafts', headers=self.headers['owner'], json=self.payload)
        self.assertEqual(saved.status_code, 200, saved.text)
        draft_id = saved.json()['id']
        path = f'/question-builder/drafts/{draft_id}'
        loaded = self.client.get(path, headers=self.headers['owner']).json()
        self.assertEqual(loaded['questions'], [self.question])
        self.assertEqual(self.client.get(path, headers=self.headers['peer']).status_code, 403)
        self.assertEqual(self.client.get('/question-builder/drafts?scope=project', headers=self.headers['peer']).json(), [])
        self.assertEqual(self.client.get(path, headers=self.headers['admin']).status_code, 200)
        update = {**self.payload, 'visibility': 'Project', 'expectedUpdatedAt': loaded['updatedAt']}
        result = self.client.put(path, headers=self.headers['owner'], json=update)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(self.client.get(path, headers=self.headers['peer']).status_code, 200)
        self.assertEqual(self.client.get(path, headers=self.headers['other']).status_code, 403)
        self.assertEqual(self.client.put(path, headers=self.headers['peer'], json=update).status_code, 403)
        self.assertEqual(self.client.put(path, headers=self.headers['owner'], json=update).status_code, 409)

    def test_invalid_question_and_file_ownership(self):
        invalid = copy.deepcopy(self.payload)
        invalid['questions'][0]['correctAnswer'] = 'Z'
        self.assertEqual(self.client.post('/question-builder/drafts', headers=self.headers['owner'], json=invalid).status_code, 422)
        invalid = copy.deepcopy(self.payload)
        invalid['files'] = [{'storage': {'bucket': 'wrong', 'key': 'question-builder/2/note.txt'}}]
        self.assertEqual(self.client.post('/question-builder/drafts', headers=self.headers['owner'], json=invalid).status_code, 403)

    def test_all_application_routes_require_staff(self):
        from main import app
        def db():
            with self.sessions() as session:
                yield session
        app.dependency_overrides[auth_service.get_db] = db
        try:
            with TestClient(app) as client:
                for path in ['/assessment-questions/package/-1', '/trades/', '/cmcs/']:
                    self.assertEqual(client.get(path).status_code, 401, path)
                    self.assertEqual(client.get(path, headers=self.headers['owner']).status_code, 403, path)
        finally:
            app.dependency_overrides.clear()

    def test_generation_rejects_incomplete_results(self):
        settings = qb.QuestionBuilderSettings(questionTypes=['Objektif'], objectiveCount=1, objectiveSingleCount=1, skillCategories=['Prosedur'], difficultyLevels=['Aras Rendah'])
        result = qb.enforce_generation_settings({'questions': [copy.deepcopy(self.question)]}, settings)
        self.assertEqual(result['questions'][0]['correctAnswer'], 'B')
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as caught:
            qb.enforce_generation_settings({'questions': []}, settings)
        self.assertEqual(caught.exception.status_code, 502)

    def test_secret_required_and_rotation_rejects_old_token(self):
        from fastapi import HTTPException
        old_secret = os.environ['AUTH_SECRET_KEY']
        token = self.headers['owner']['Authorization'].split(' ', 1)[1]
        try:
            os.environ['AUTH_SECRET_KEY'] = 'skp-cidb-dev-secret'
            with self.assertRaises(HTTPException) as caught:
                auth_service.decode_access_token(token)
            self.assertEqual(caught.exception.status_code, 503)
            os.environ['AUTH_SECRET_KEY'] = secrets.token_hex(32)
            with self.assertRaises(HTTPException) as caught:
                auth_service.decode_access_token(token)
            self.assertEqual(caught.exception.status_code, 401)
        finally:
            os.environ['AUTH_SECRET_KEY'] = old_secret


if __name__ == '__main__':
    unittest.main()
