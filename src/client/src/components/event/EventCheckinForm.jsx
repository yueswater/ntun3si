import { useState, useRef } from "react";
import { post } from "../../utils/api";

export default function EventCheckinForm({ eventUid }) {
    const [name, setName] = useState("");
    const [phoneLast3, setPhoneLast3] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [mode, setMode] = useState("checkin"); // "checkin" or "checkout"
    const [showConfirm, setShowConfirm] = useState(false);
    const confirmDialogRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });

        if (!name.trim()) {
            setMessage({ type: "error", text: "請輸入姓名" });
            return;
        }
        if (!phoneLast3.trim() || !/^\d{3}$/.test(phoneLast3.trim())) {
            setMessage({ type: "error", text: "請輸入正確的手機末三碼（3 位數字）" });
            return;
        }

        if (mode === "checkout") {
            setShowConfirm(true);
            confirmDialogRef.current?.showModal();
            return;
        }

        await doCheckin();
    };

    const doCheckin = async () => {
        setSubmitting(true);
        try {
            const res = await post(`/checkin/event/${eventUid}`, {
                name: name.trim(),
                phoneLast3: phoneLast3.trim(),
            });
            setMessage({ type: "success", text: res.message });
            setName("");
            setPhoneLast3("");
        } catch (err) {
            const errMsg =
                err.response?.data?.error?.message || "簽到失敗，請稍後再試";
            const code = err.response?.data?.error?.code;
            setMessage({
                type: code === "ALREADY_CHECKED_IN" || code === "ALREADY_CHECKED_OUT" ? "warning" : "error",
                text: errMsg,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const doCheckout = async () => {
        setShowConfirm(false);
        confirmDialogRef.current?.close();
        setSubmitting(true);
        try {
            const res = await post(`/checkin/event/${eventUid}/checkout`, {
                name: name.trim(),
                phoneLast3: phoneLast3.trim(),
            });
            setMessage({ type: "success", text: res.message });
            setName("");
            setPhoneLast3("");
        } catch (err) {
            const errMsg =
                err.response?.data?.error?.message || "簽退失敗，請稍後再試";
            const code = err.response?.data?.error?.code;
            setMessage({
                type: code === "ALREADY_CHECKED_OUT" ? "warning" : "error",
                text: errMsg,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const cancelConfirm = () => {
        setShowConfirm(false);
        confirmDialogRef.current?.close();
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {message.text && (
                    <div
                        className={`alert ${message.type === "success"
                            ? "alert-success"
                            : message.type === "warning"
                                ? "alert-warning"
                                : "alert-error"
                            }`}
                    >
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Mode toggle */}
                <div className="tabs tabs-boxed justify-center">
                    <button
                        type="button"
                        className={`tab ${mode === "checkin" ? "tab-active" : ""}`}
                        onClick={() => { setMode("checkin"); setMessage({ type: "", text: "" }); }}
                    >
                        簽到
                    </button>
                    <button
                        type="button"
                        className={`tab ${mode === "checkout" ? "tab-active" : ""}`}
                        onClick={() => { setMode("checkout"); setMessage({ type: "", text: "" }); }}
                    >
                        簽退
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                報名姓名 <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input input-bordered"
                            placeholder="請輸入報名時填寫的姓名"
                            required
                        />
                    </div>

                    {/* Phone last 3 digits */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                手機末三碼 <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={3}
                            value={phoneLast3}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                                setPhoneLast3(digits);
                            }}
                            className="input input-bordered"
                            placeholder="例如：456"
                            required
                        />
                    </div>
                </div>

                <div className="form-control mt-4">
                    <button
                        type="submit"
                        className={`btn btn-lg ${mode === "checkin" ? "btn-primary" : "btn-warning"}`}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="loading loading-spinner"></span>
                                {mode === "checkin" ? "簽到中..." : "簽退中..."}
                            </>
                        ) : (
                            mode === "checkin" ? "簽到" : "簽退"
                        )}
                    </button>
                </div>
            </form>

            {/* Checkout confirmation dialog */}
            <dialog ref={confirmDialogRef} className="modal" onClose={cancelConfirm}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg">確認簽退</h3>
                    <p className="py-4">您是否確認要簽退？簽退後將<strong>無法再次簽到</strong>。</p>
                    <div className="modal-action">
                        <button className="btn" onClick={cancelConfirm}>
                            取消
                        </button>
                        <button className="btn btn-warning" onClick={doCheckout}>
                            確認簽退
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}
