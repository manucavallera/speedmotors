import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../lib/api";
import { toast } from "../lib/toast";
import { InfoBanner } from "../components/ui/InfoBanner";
import {
  FormField,
  inputStyle,
  btnPrimary,
  btnSecondary,
} from "../components/ui/FormField";

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  internalCode?: string | null;
  sellPrice?: string | number;
};
type Consignment = {
  id: number;
  resellerId: number;
  vehicleId: number;
  deliveredAt: string;
  agreedPrice: string | number | null;
  soldAt: string | null;
  soldPrice: string | number | null;
  vehicle: Vehicle | null;
};
type Reseller = {
  id: number;
  name: string;
  phone: string | null;
  consignments: Consignment[];
};
type VehiclesResponse = { items: Vehicle[] };

export function ResalesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [resellerId, setResellerId] = useState("");
  const [editingConsignmentId, setEditingConsignmentId] = useState<number | null>(null);
  const [editingResellerId, setEditingResellerId] = useState("");
  const [editingVehicleId, setEditingVehicleId] = useState("");
  const [editingDeliveredAt, setEditingDeliveredAt] = useState("");
  const { data: resellers = [], isLoading } = useQuery<Reseller[]>({
    queryKey: ["resales"],
    queryFn: () => api.get("/resales").then((r) => r.data),
  });
  const { data: vehiclesData } = useQuery<VehiclesResponse>({
    queryKey: ["vehicles", "resale-available"],
    queryFn: () =>
      api
        .get("/vehicles", {
          params: { type: "moto", status: "disponible", limit: 500 },
        })
        .then((r) => r.data),
  });
  const vehicles = vehiclesData?.items ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["resales"] });
  const refreshVehicles = () =>
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  const createReseller = useMutation({
    mutationFn: () => api.post("/resales/resellers", { name, phone }),
    onSuccess: () => {
      setName("");
      setPhone("");
      refresh();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const updateReseller = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; phone: string };
    }) => api.patch(`/resales/resellers/${id}`, data),
    onSuccess: refresh,
    onError: (e) => toast.error(apiError(e)),
  });
  const deleteReseller = useMutation({
    mutationFn: (id: number) => api.delete(`/resales/resellers/${id}`),
    onSuccess: refresh,
    onError: (e) => toast.error(apiError(e)),
  });
  const consign = useMutation({
    mutationFn: () =>
      api.post("/resales/consignments", {
        resellerId: Number(resellerId),
        vehicleId: Number(vehicleId),
      }),
    onSuccess: () => {
      setVehicleId("");
      refresh();
      refreshVehicles();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const removeConsignment = useMutation({
    mutationFn: (id: number) => api.delete(`/resales/consignments/${id}`),
    onSuccess: () => {
      refresh();
      refreshVehicles();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const updateConsignment = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { resellerId: number; vehicleId: number; deliveredAt: string };
    }) => api.patch("/resales/consignments/" + id, data),
    onSuccess: () => {
      setEditingConsignmentId(null);
      refresh();
      refreshVehicles();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const sold = useMutation({
    mutationFn: (id: number) =>
      api.post("/resales/consignments/" + id + "/sold", {}),
    onSuccess: () => {
      refresh();
      refreshVehicles();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const editReseller = (reseller: Reseller) => {
    const nextName = window.prompt("Nombre del negocio", reseller.name);
    if (nextName === null) return;
    const nextPhone = window.prompt("Teléfono", reseller.phone || "");
    if (nextPhone === null) return;
    updateReseller.mutate({
      id: reseller.id,
      data: { name: nextName, phone: nextPhone },
    });
  };

  const removeReseller = (reseller: Reseller) => {
    if (reseller.consignments.length > 0) {
      toast.error("Primero quitá las motos consignadas");
      return;
    }
    if (window.confirm(`¿Eliminar la reventa ${reseller.name}?`))
      deleteReseller.mutate(reseller.id);
  };

  const removeConsignmentWithConfirmation = (id: number) => {
    if (
      window.confirm(
        "¿Quitar esta consignación? La moto volverá a estar disponible.",
      )
    )
      removeConsignment.mutate(id);
  };

  const startConsignmentEdit = (reseller: Reseller, consignment: Consignment) => {
    setEditingConsignmentId(consignment.id);
    setEditingResellerId(String(reseller.id));
    setEditingVehicleId(String(consignment.vehicleId));
    setEditingDeliveredAt(consignment.deliveredAt);
  };

  const saveConsignmentEdit = () => {
    if (!editingConsignmentId) return;
    updateConsignment.mutate({
      id: editingConsignmentId,
      data: {
        resellerId: Number(editingResellerId),
        vehicleId: Number(editingVehicleId),
        deliveredAt: editingDeliveredAt,
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>
            Reventas
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Motos en consignación
          </p>
        </div>
      </div>
      <InfoBanner title="Consignación">
        <strong>Reventa</strong> son los negocios que reciben motos y pagan
        cuando las venden.
      </InfoBanner>
      <div className="form-grid-2" style={{ marginBottom: "18px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createReseller.mutate();
          }}
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>
            Nuevo reventa
          </h3>
          <FormField label="Nombre del negocio">
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Teléfono">
            <input
              style={inputStyle}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
          <button style={btnPrimary} disabled={createReseller.isPending}>
            Guardar negocio
          </button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            consign.mutate();
          }}
          style={{
            background: "white",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>
            Entregar moto en consignación
          </h3>
          <FormField label="Reventa">
            <select
              style={inputStyle}
              value={resellerId}
              onChange={(e) => setResellerId(e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Moto disponible">
            <select
              style={inputStyle}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} · {v.internalCode || `#${v.id}`}
                </option>
              ))}
            </select>
          </FormField>
          <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "13px" }}>
            El precio se toma de la lista vigente al momento del pago.
          </p>
          <button style={btnPrimary} disabled={consign.isPending}>
            Entregar moto
          </button>
        </form>
      </div>
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        resellers.map((r) => (
          <div
            key={r.id}
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              <span>
                {r.name}{" "}
                {r.phone && (
                  <span style={{ color: "#64748b", fontWeight: 400 }}>
                    · {r.phone}
                  </span>
                )}
              </span>
              <button
                style={{
                  ...btnSecondary,
                  padding: "5px 10px",
                  fontSize: "12px",
                }}
                onClick={() => editReseller(r)}
              >
                Editar reventa
              </button>
              <button
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
                onClick={() => removeReseller(r)}
              >
                Eliminar
              </button>
            </div>
            {r.consignments.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                Sin motos consignadas.
              </p>
            ) : (
              r.consignments.map((c) => (
                <div key={c.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <span>
                      {c.vehicle?.brand} {c.vehicle?.model} ·{" "}
                      {c.soldAt
                        ? "Pagado a $" + Number(c.soldPrice ?? 0).toLocaleString("es-AR")
                        : "Precio según lista al momento del pago"}{" "}
                      {c.soldAt ? (
                        <strong style={{ color: "#16a34a" }}>· Vendida</strong>
                      ) : (
                        <span style={{ color: "#d97706" }}>· Consignada</span>
                      )}
                    </span>
                    <span style={{ display: "flex", gap: "6px" }}>
                      {!c.soldAt && (
                        <>
                          <button
                            style={{ ...btnPrimary, padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => {
                              const currentPrice = Number(c.vehicle?.sellPrice ?? 0).toLocaleString("es-AR");
                              if (window.confirm("¿Registrar el pago a $" + currentPrice + ", según la lista vigente?")) sold.mutate(c.id);
                            }}
                          >
                            Registrar pago
                          </button>
                          <button
                            style={{ ...btnSecondary, padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => startConsignmentEdit(r, c)}
                          >
                            Editar consignación
                          </button>
                          <button
                            style={{ ...btnSecondary, padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => removeConsignmentWithConfirmation(c.id)}
                          >
                            Quitar consignación
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  {editingConsignmentId === c.id && !c.soldAt && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: "8px", alignItems: "end", padding: "10px 0" }}>
                      <FormField label="Reventa">
                        <select style={inputStyle} value={editingResellerId} onChange={(e) => setEditingResellerId(e.target.value)}>
                          {resellers.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Moto">
                        <select style={inputStyle} value={editingVehicleId} onChange={(e) => setEditingVehicleId(e.target.value)}>
                          {([c.vehicle, ...vehicles.filter((vehicle) => vehicle.id !== c.vehicleId)]).filter(Boolean).map((option) => <option key={option!.id} value={option!.id}>{option!.brand} {option!.model}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Fecha de entrega">
                        <input style={inputStyle} type="date" value={editingDeliveredAt} onChange={(e) => setEditingDeliveredAt(e.target.value)} />
                      </FormField>
                      <button style={{ ...btnPrimary, padding: "9px 12px" }} onClick={saveConsignmentEdit} disabled={updateConsignment.isPending}>Guardar</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}
