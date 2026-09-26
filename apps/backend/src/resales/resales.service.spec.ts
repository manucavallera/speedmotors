/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { resaleConsignments, resellers } from '../db/schema';
import { ResalesService } from './resales.service';

jest.mock('../db', () => ({
  db: {
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe('ResalesService management', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates a reseller with trimmed editable fields', async () => {
    const updated = {
      id: 4,
      name: 'Moto Centro',
      phone: '11223344',
      notes: null,
    };
    const returning = jest.fn().mockResolvedValue([updated]);
    const where = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where });
    jest.mocked(db.update).mockReturnValue({ set } as never);

    await expect(
      new ResalesService().updateReseller(4, {
        name: '  Moto Centro  ',
        phone: ' 11223344 ',
        notes: '  ',
      }),
    ).resolves.toEqual(updated);

    expect(set).toHaveBeenCalledWith({
      name: 'Moto Centro',
      phone: '11223344',
      notes: null,
    });
    expect(where).toHaveBeenCalled();
  });

  it('removes an unsold consignment and makes its vehicle available again', async () => {
    const consignment = { id: 8, vehicleId: 21, soldAt: null };
    const selectWhere = jest.fn().mockResolvedValue([consignment]);
    const select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({ where: selectWhere }),
    });
    const vehicleWhere = jest.fn().mockResolvedValue([]);
    const vehicleSet = jest.fn().mockReturnValue({ where: vehicleWhere });
    const update = jest.fn().mockReturnValue({ set: vehicleSet });
    const deleteWhere = jest.fn().mockResolvedValue([]);
    const deleteMock = jest.fn().mockReturnValue({ where: deleteWhere });
    const tx = { select, update, delete: deleteMock };
    jest
      .mocked(db.transaction)
      .mockImplementation(async (callback) => callback(tx as never));

    await expect(new ResalesService().removeConsignment(8)).resolves.toEqual({
      deleted: true,
    });

    expect(vehicleSet).toHaveBeenCalledWith({
      status: 'disponible',
      updatedAt: expect.any(Date),
    });
    expect(deleteMock).toHaveBeenCalledWith(resaleConsignments);
    expect(deleteWhere).toHaveBeenCalled();
  });

  it('does not delete a reseller while it still has consignments', async () => {
    const selectWhere = jest.fn().mockResolvedValue([{ id: 8 }]);
    const select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({ where: selectWhere }),
    });
    const deleteMock = jest.fn();
    const tx = { select, delete: deleteMock };
    jest
      .mocked(db.transaction)
      .mockImplementation(async (callback) => callback(tx as never));

    await expect(new ResalesService().deleteReseller(4)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('deletes an empty reseller', async () => {
    const selectWhere = jest.fn().mockResolvedValue([]);
    const select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({ where: selectWhere }),
    });
    const deleteWhere = jest.fn().mockResolvedValue([]);
    const deleteMock = jest.fn().mockReturnValue({ where: deleteWhere });
    const tx = { select, delete: deleteMock };
    jest
      .mocked(db.transaction)
      .mockImplementation(async (callback) => callback(tx as never));

    await expect(new ResalesService().deleteReseller(4)).resolves.toEqual({
      deleted: true,
    });
    expect(deleteMock).toHaveBeenCalledWith(resellers);
    expect(deleteWhere).toHaveBeenCalled();
  });

  it('uses the vehicle price list when registering the payment', async () => {
    const consignment = { id: 8, vehicleId: 21, soldAt: null };
    const vehicle = { id: 21, sellPrice: '2450000.00' };
    const selectResults = [[consignment], [vehicle]];
    const select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockImplementation(async () => selectResults.shift()),
      }),
    });
    const resaleWhere = {
      returning: jest.fn().mockResolvedValue([
        { ...consignment, soldAt: '2026-09-26', soldPrice: '2450000.00' },
      ]),
    };
    const resaleUpdateWhere = jest.fn().mockReturnValue(resaleWhere);
    const update = jest.fn()
      .mockReturnValueOnce({ set: jest.fn().mockReturnValue({ where: resaleUpdateWhere }) })
      .mockReturnValueOnce({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) });
    const tx = { select, update };
    jest
      .mocked(db.transaction)
      .mockImplementation(async (callback) => callback(tx as never));

    await expect(new ResalesService().registerSale(8)).resolves.toMatchObject({
      soldPrice: '2450000.00',
    });
    expect(update).toHaveBeenCalled();
    expect(update.mock.results[0].value.set).toHaveBeenCalledWith({
      soldPrice: '2450000.00',
      soldAt: '2026-09-26',
    });
  });

  it('does not edit a completed consignment', async () => {
    const selectWhere = jest.fn().mockResolvedValue([
      { id: 8, vehicleId: 21, soldAt: '2026-09-26' },
    ]);
    const select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({ where: selectWhere }),
    });
    const tx = { select, update: jest.fn() };
    jest
      .mocked(db.transaction)
      .mockImplementation(async (callback) => callback(tx as never));

    await expect(
      new ResalesService().updateConsignment(8, { deliveredAt: '2026-09-27' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('does not remove a completed consignment', async () => {
    const selectWhere = jest.fn().mockResolvedValue([
      { id: 8, vehicleId: 21, soldAt: '2026-09-26' },
    ]);
    const select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({ where: selectWhere }),
    });
    const tx = { select, update: jest.fn(), delete: jest.fn() };
    jest
      .mocked(db.transaction)
      .mockImplementation(async (callback) => callback(tx as never));

    await expect(new ResalesService().removeConsignment(8)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.delete).not.toHaveBeenCalled();
  });
});
