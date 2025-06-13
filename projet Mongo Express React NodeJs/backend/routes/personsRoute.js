import express from 'express';
import * as personController from '../controllers/personsController.js';

const router = express.Router();

router
  .route('/')
  .get(personController.getAllPersons)
  .post(personController.createPerson);

router
  .route('/:id')
  .get(personController.getPerson)
  .patch(personController.updatePerson)
  .delete(personController.deletePerson);

export default router;
