#pragma once

#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include "seal/seal.h"

namespace ckks_playground {

/**
 * Serializes any Microsoft SEAL object (Ciphertext, RelinKeys, PublicKey)
 * into a compressed Base64 string or binary stream.
 */
template <typename T>
std::string serialize_to_string(const T& obj, seal::compr_mode_type compr = seal::compr_mode_type::zlib) {
    std::ostringstream ss;
    obj.save(ss, compr);
    return ss.str();
}

/**
 * Deserializes any Microsoft SEAL object from a binary stream.
 */
template <typename T>
void deserialize_from_string(const seal::SEALContext& context, const std::string& data, T& out_obj) {
    std::istringstream ss(data);
    out_obj.load(context, ss);
}

} // namespace ckks_playground
