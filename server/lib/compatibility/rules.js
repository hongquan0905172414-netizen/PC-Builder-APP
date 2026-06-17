/*
  Pure compatibility rules. No I/O, no parts.json reads, no AI/LLM imports.
  Each rule takes the resolved build (slot -> part object with a `.compat`
  sub-object) and returns either null (required parts missing — skip) or
  a check: { id, status: 'pass'|'fail'|'warning', parts: [ids], message, fix? }
*/

const PSU_WATTAGE_OVERHEAD = 75; // mobo + RAM + storage + fans, watts

export function checkCpuSocket(build) {
  const { cpu, motherboard } = build;
  if (!cpu || !motherboard) return null;

  if (cpu.compat.socket === motherboard.compat.socket) {
    return {
      id: 'cpu-socket', status: 'pass', parts: [cpu.id, motherboard.id],
      message: `${cpu.name} matches the ${motherboard.compat.socket} socket on ${motherboard.name}.`,
    };
  }
  return {
    id: 'cpu-socket', status: 'fail', parts: [cpu.id, motherboard.id],
    message: `${cpu.name} uses a ${cpu.compat.socket} socket, but ${motherboard.name} only supports ${motherboard.compat.socket}. They cannot physically connect.`,
    fix: `Pick a motherboard with a ${cpu.compat.socket} socket, or a CPU that uses ${motherboard.compat.socket}.`,
  };
}

export function checkRamType(build) {
  const { ram, motherboard } = build;
  if (!ram || !motherboard) return null;

  if (ram.compat.ram_type === motherboard.compat.ram_type) {
    return {
      id: 'ram-type', status: 'pass', parts: [ram.id, motherboard.id],
      message: `${ram.name} is ${ram.compat.ram_type}, matching ${motherboard.name}.`,
    };
  }
  return {
    id: 'ram-type', status: 'fail', parts: [ram.id, motherboard.id],
    message: `${ram.name} is ${ram.compat.ram_type}, but ${motherboard.name} only takes ${motherboard.compat.ram_type}. The modules won't fit in the slots.`,
    fix: `Get ${motherboard.compat.ram_type} memory instead of ${ram.compat.ram_type}.`,
  };
}

export function checkRamModuleCount(build) {
  const { ram, motherboard } = build;
  if (!ram || !motherboard) return null;

  if (ram.compat.modules <= motherboard.compat.ram_slots) {
    return {
      id: 'ram-modules', status: 'pass', parts: [ram.id, motherboard.id],
      message: `${ram.name} uses ${ram.compat.modules} of the ${motherboard.compat.ram_slots} RAM slots on ${motherboard.name}.`,
    };
  }
  return {
    id: 'ram-modules', status: 'fail', parts: [ram.id, motherboard.id],
    message: `${ram.name} has ${ram.compat.modules} sticks, but ${motherboard.name} only has ${motherboard.compat.ram_slots} RAM slots.`,
    fix: `Choose a RAM kit with ${motherboard.compat.ram_slots} or fewer modules, or a motherboard with more slots.`,
  };
}

export function checkRamSpeed(build) {
  const { ram, motherboard } = build;
  if (!ram || !motherboard) return null;

  if (ram.compat.speed <= motherboard.compat.ram_speed_max) {
    return {
      id: 'ram-speed', status: 'pass', parts: [ram.id, motherboard.id],
      message: `${motherboard.name} fully supports ${ram.name}'s rated speed.`,
    };
  }
  return {
    id: 'ram-speed', status: 'warning', parts: [ram.id, motherboard.id],
    message: `${ram.name} is rated for DDR${ram.compat.speed}, but ${motherboard.name} officially supports up to ${motherboard.compat.ram_speed_max}. It will still work — it'll just run at the board's max speed unless you manually tune timings in BIOS.`,
  };
}

export function checkGpuCaseLength(build) {
  const { gpu, case: pcCase } = build;
  if (!gpu || !pcCase) return null;

  if (gpu.compat.length_mm <= pcCase.compat.max_gpu_length_mm) {
    return {
      id: 'gpu-length', status: 'pass', parts: [gpu.id, pcCase.id],
      message: `${gpu.name} (${gpu.compat.length_mm} mm) fits inside ${pcCase.name} (max ${pcCase.compat.max_gpu_length_mm} mm).`,
    };
  }
  return {
    id: 'gpu-length', status: 'fail', parts: [gpu.id, pcCase.id],
    message: `${gpu.name} is ${gpu.compat.length_mm} mm long, but ${pcCase.name} only fits GPUs up to ${pcCase.compat.max_gpu_length_mm} mm. The card won't fit.`,
    fix: `Pick a shorter GPU (≤${pcCase.compat.max_gpu_length_mm} mm) or a larger case.`,
  };
}

export function checkCoolerFit(build) {
  const { cooling, case: pcCase } = build;
  if (!cooling || !pcCase) return null;

  if (cooling.compat.type === 'air') {
    if (cooling.compat.height_mm <= pcCase.compat.max_cooler_height_mm) {
      return {
        id: 'cooler-fit', status: 'pass', parts: [cooling.id, pcCase.id],
        message: `${cooling.name} (${cooling.compat.height_mm} mm tall) fits under the side panel of ${pcCase.name} (max ${pcCase.compat.max_cooler_height_mm} mm).`,
      };
    }
    return {
      id: 'cooler-fit', status: 'fail', parts: [cooling.id, pcCase.id],
      message: `${cooling.name} is ${cooling.compat.height_mm} mm tall, but ${pcCase.name} only has ${pcCase.compat.max_cooler_height_mm} mm of clearance. The side panel won't close.`,
      fix: `Choose a shorter air cooler (≤${pcCase.compat.max_cooler_height_mm} mm) or switch to an AIO liquid cooler.`,
    };
  }

  if (cooling.compat.type === 'aio') {
    if (pcCase.compat.radiator_sizes_mm.includes(cooling.compat.radiator_size_mm)) {
      return {
        id: 'cooler-fit', status: 'pass', parts: [cooling.id, pcCase.id],
        message: `${pcCase.name} has a mount for ${cooling.name}'s ${cooling.compat.radiator_size_mm} mm radiator.`,
      };
    }
    return {
      id: 'cooler-fit', status: 'fail', parts: [cooling.id, pcCase.id],
      message: `${cooling.name} needs a ${cooling.compat.radiator_size_mm} mm radiator mount, but ${pcCase.name} only supports: ${pcCase.compat.radiator_sizes_mm.join(', ')} mm.`,
      fix: `Pick a radiator size ${pcCase.name} supports (${pcCase.compat.radiator_sizes_mm.join(', ')} mm), or a different case.`,
    };
  }

  return null;
}

export function checkCoolerSocket(build) {
  const { cooling, cpu } = build;
  if (!cooling || !cpu) return null;

  if (cooling.compat.sockets_supported.includes(cpu.compat.socket)) {
    return {
      id: 'cooler-socket', status: 'pass', parts: [cooling.id, cpu.id],
      message: `${cooling.name} includes a mounting bracket for ${cpu.compat.socket}.`,
    };
  }
  return {
    id: 'cooler-socket', status: 'fail', parts: [cooling.id, cpu.id],
    message: `${cooling.name} doesn't come with a mounting bracket for ${cpu.compat.socket} — it only supports: ${cooling.compat.sockets_supported.join(', ')}.`,
    fix: `Choose a cooler that lists ${cpu.compat.socket} as supported.`,
  };
}

export function checkMoboFormFactor(build) {
  const { motherboard, case: pcCase } = build;
  if (!motherboard || !pcCase) return null;

  if (pcCase.compat.form_factors_supported.includes(motherboard.compat.form_factor)) {
    return {
      id: 'mobo-form-factor', status: 'pass', parts: [motherboard.id, pcCase.id],
      message: `${pcCase.name} supports ${motherboard.compat.form_factor} motherboards like ${motherboard.name}.`,
    };
  }
  return {
    id: 'mobo-form-factor', status: 'fail', parts: [motherboard.id, pcCase.id],
    message: `${motherboard.name} is ${motherboard.compat.form_factor}, but ${pcCase.name} only fits: ${pcCase.compat.form_factors_supported.join(', ')}.`,
    fix: `Pick a case that supports ${motherboard.compat.form_factor}, or a motherboard in a supported form factor.`,
  };
}

export function checkPsuFormFactor(build) {
  const { psu, case: pcCase } = build;
  if (!psu || !pcCase) return null;

  if (pcCase.compat.psu_form_factors_supported.includes(psu.compat.form_factor)) {
    return {
      id: 'psu-form-factor', status: 'pass', parts: [psu.id, pcCase.id],
      message: `${pcCase.name} accepts ${psu.compat.form_factor} power supplies like ${psu.name}.`,
    };
  }
  return {
    id: 'psu-form-factor', status: 'fail', parts: [psu.id, pcCase.id],
    message: `${psu.name} is a ${psu.compat.form_factor} power supply, but ${pcCase.name} only fits: ${pcCase.compat.psu_form_factors_supported.join(', ')}. It physically won't fit in the PSU bay.`,
    fix: `Get a ${pcCase.compat.psu_form_factors_supported.join(' or ')} power supply for this case.`,
  };
}

export function checkPsuWattage(build) {
  const { cpu, gpu, psu } = build;
  if (!cpu || !gpu || !psu) return null;

  const rawDraw = cpu.compat.tdp_watts + gpu.compat.tdp_watts + PSU_WATTAGE_OVERHEAD;
  const required = Math.max(gpu.compat.recommended_psu_watts, rawDraw);

  if (psu.compat.wattage >= required) {
    return {
      id: 'psu-wattage', status: 'pass', parts: [cpu.id, gpu.id, psu.id],
      message: `${psu.name} (${psu.compat.wattage}W) comfortably covers the estimated ${rawDraw}W draw and ${gpu.name}'s ${gpu.compat.recommended_psu_watts}W recommendation.`,
    };
  }
  return {
    id: 'psu-wattage', status: 'fail', parts: [cpu.id, gpu.id, psu.id],
    message: `Estimated power draw is about ${rawDraw}W (CPU + GPU + overhead), and ${gpu.name} recommends at least ${gpu.compat.recommended_psu_watts}W. ${psu.name} only supplies ${psu.compat.wattage}W — that's not enough.`,
    fix: `Use a power supply rated at ${required}W or higher.`,
  };
}

export function checkGpuPowerConnector(build) {
  const { gpu, psu } = build;
  if (!gpu || !psu) return null;

  if (gpu.compat.power_connector !== '12VHPWR') {
    if (psu.compat.pcie_8pin >= gpu.compat.pcie_8pin_required) {
      return {
        id: 'gpu-power-connector', status: 'pass', parts: [gpu.id, psu.id],
        message: `${psu.name} has enough PCIe 8-pin connectors for ${gpu.name}.`,
      };
    }
    return {
      id: 'gpu-power-connector', status: 'fail', parts: [gpu.id, psu.id],
      message: `${gpu.name} needs ${gpu.compat.pcie_8pin_required} PCIe 8-pin connectors, but ${psu.name} only has ${psu.compat.pcie_8pin}. It can't power the card.`,
      fix: `Use a PSU with at least ${gpu.compat.pcie_8pin_required} PCIe 8-pin connectors.`,
    };
  }

  if (psu.compat.native_12vhpwr >= 1) {
    return {
      id: 'gpu-power-connector', status: 'pass', parts: [gpu.id, psu.id],
      message: `${psu.name} has a native 12VHPWR connector for ${gpu.name}.`,
    };
  }
  if (psu.compat.pcie_8pin >= gpu.compat.pcie_8pin_required) {
    return {
      id: 'gpu-power-connector', status: 'warning', parts: [gpu.id, psu.id],
      message: `${psu.name} doesn't have a native 12VHPWR connector, but it has enough PCIe 8-pin connectors to use ${gpu.name}'s included adapter.`,
    };
  }
  return {
    id: 'gpu-power-connector', status: 'fail', parts: [gpu.id, psu.id],
    message: `${gpu.name} needs a 12VHPWR connection, and ${psu.name} has neither a native 12VHPWR port nor enough PCIe 8-pin connectors (${gpu.compat.pcie_8pin_required} needed) for the adapter.`,
    fix: `Use a PSU with native 12VHPWR or at least ${gpu.compat.pcie_8pin_required} PCIe 8-pin connectors.`,
  };
}

export function checkStorageInterface(build) {
  const { storage, motherboard } = build;
  if (!storage || !motherboard) return null;

  if (storage.compat.interface === 'NVMe') {
    if (motherboard.compat.m2_slots >= 1) {
      return {
        id: 'storage-interface', status: 'pass', parts: [storage.id, motherboard.id],
        message: `${motherboard.name} has an onboard M.2 slot for ${storage.name}.`,
      };
    }
    return {
      id: 'storage-interface', status: 'fail', parts: [storage.id, motherboard.id],
      message: `${storage.name} is an NVMe M.2 drive, but ${motherboard.name} has no onboard M.2 slots.`,
      fix: `Choose a motherboard with at least one M.2 slot, or use a SATA drive instead.`,
    };
  }

  if (storage.compat.interface === 'SATA') {
    if (motherboard.compat.sata_ports >= 1) {
      return {
        id: 'storage-interface', status: 'pass', parts: [storage.id, motherboard.id],
        message: `${motherboard.name} has a free SATA port for ${storage.name}.`,
      };
    }
    return {
      id: 'storage-interface', status: 'fail', parts: [storage.id, motherboard.id],
      message: `${storage.name} needs a SATA port, but ${motherboard.name} has none.`,
      fix: `Choose a motherboard with SATA ports, or use an NVMe M.2 drive instead.`,
    };
  }

  return null;
}

// Manufacturers don't publish official cooler TDP ratings, so this is a
// general caution rather than a measured pass/fail — always a warning.
export function checkCpuCoolerCapacity(build) {
  const { cpu, cooling } = build;
  if (!cpu || !cooling) return null;

  if (cpu.compat.tdp_watts > 200) {
    return {
      id: 'cooler-capacity', status: 'warning', parts: [cpu.id, cooling.id],
      message: `${cpu.name} can draw over 200W under heavy load. Make sure ${cooling.name} is a high-performance cooler — there's no official wattage rating to check against, so this is a general caution, not a measured failure.`,
    };
  }
  return {
    id: 'cooler-capacity', status: 'pass', parts: [cpu.id, cooling.id],
    message: `${cpu.name}'s power draw is within the range most coolers, including ${cooling.name}, handle comfortably.`,
  };
}

export const RULES = [
  checkCpuSocket,
  checkRamType,
  checkRamModuleCount,
  checkRamSpeed,
  checkGpuCaseLength,
  checkCoolerFit,
  checkCoolerSocket,
  checkMoboFormFactor,
  checkPsuFormFactor,
  checkPsuWattage,
  checkGpuPowerConnector,
  checkStorageInterface,
  checkCpuCoolerCapacity,
];
