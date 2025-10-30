export default function EventFormFields({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label font-semibold">活動描述</label>
        <textarea
          name="description"
          className="textarea textarea-bordered w-full h-24 resize-none rounded-2xl"
          value={form.description}
          onChange={onChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label font-semibold">時間</label>
          <input
            type="datetime-local"
            name="date"
            className="input input-bordered w-full"
            value={form.date}
            onChange={onChange}
          />
        </div>
        <div>
          <label className="label font-semibold">地點</label>
          <input
            type="text"
            name="location"
            className="input input-bordered w-full"
            value={form.location}
            onChange={onChange}
          />
        </div>
      </div>

      <div>
        <label className="label font-semibold">人數上限</label>
        <input
          type="number"
          name="maxParticipants"
          className="input input-bordered w-full"
          value={form.maxParticipants}
          onChange={onChange}
        />
      </div>

      <div>
        <label className="label font-semibold">講者</label>
        <input
          type="text"
          name="speaker"
          className="input input-bordered w-full"
          value={form.speaker}
          onChange={onChange}
          placeholder="講者姓名"
        />
      </div>

      <div>
        <label className="label font-semibold">講者介紹</label>
        <textarea
          name="speakerBio"
          className="textarea textarea-bordered w-full h-24 resize-none rounded-2xl"
          value={form.speakerBio}
          onChange={onChange}
        />
      </div>

      <div>
        <label className="label font-semibold">備註</label>
        <textarea
          name="notes"
          className="textarea textarea-bordered w-full h-24 resize-none rounded-2xl"
          value={form.notes}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
