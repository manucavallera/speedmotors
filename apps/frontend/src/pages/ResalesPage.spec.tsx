import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { api } from "../lib/api";
import { ResalesPage } from "./ResalesPage";

jest.mock("../lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  apiError: jest.fn(() => "Error inesperado"),
}));

jest.mock("../lib/toast", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

describe("ResalesPage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("offers reseller editing and removal controls for an unsold consignment", async () => {
    const reseller = {
      id: 4,
      name: "Moto Centro",
      phone: "11223344",
      notes: null,
      createdAt: "2026-09-25T00:00:00.000Z",
      consignments: [
        {
          id: 8,
          resellerId: 4,
          vehicleId: 21,
          deliveredAt: "2026-09-25",
          agreedPrice: "1000000.00",
          soldAt: null,
          soldPrice: null,
          createdAt: "2026-09-25T00:00:00.000Z",
          vehicle: {
            id: 21,
            brand: "Honda",
            model: "CB 190",
            internalCode: "M-21",
            sellPrice: "2450000.00",
          },
        },
      ],
    };
    (api.get as jest.Mock).mockImplementation((url: string) =>
      Promise.resolve({
        data: url === "/resales" ? [reseller] : { items: [] },
      }),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
    const prompt = jest
      .spyOn(window, "prompt")
      .mockReturnValueOnce("Moto Centro Norte")
      .mockReturnValueOnce("11998877");

    render(
      <QueryClientProvider client={queryClient}>
        <ResalesPage />
      </QueryClientProvider>,
    );

    expect((await screen.findAllByText("Moto Centro")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("button", { name: "Editar reventa" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Quitar consignación" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Editar reventa" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("/resales/resellers/4", {
        name: "Moto Centro Norte",
        phone: "11998877",
      }),
    );
    expect(prompt).toHaveBeenCalledTimes(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Quitar consignación" }),
    );
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("/resales/consignments/8"),
    );
    expect(confirm).toHaveBeenCalled();
  });
});
