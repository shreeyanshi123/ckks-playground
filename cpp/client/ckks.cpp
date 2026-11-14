#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <string>
#include <memory>
#include <cmath>
#include <sstream>
#include "seal/seal.h"
#include "../common/serialization.hpp"

using namespace emscripten;
using namespace seal;

/**
 * CKKSModule manages the in-memory WASM state for Microsoft SEAL CKKS operations.
 * 
 * In accordance with strict cryptographic best practices:
 * - Secret keys and intermediate ciphertexts are retained in WASM runtime memory
 * - Secret keys are never exposed directly to JavaScript/React state
 */
class CKKSModule {
public:
    CKKSModule() : is_initialized_(false), has_computed_result_(false) {}

    /**
     * Initializes CKKS parameters and SEAL Context in WASM memory.
     */
    bool initializeCKKS() {
        try {
            EncryptionParameters parms(scheme_type::ckks);
            size_t poly_modulus_degree = 8192;
            parms.set_poly_modulus_degree(poly_modulus_degree);
            parms.set_coeff_modulus(CoeffModulus::Create(poly_modulus_degree, { 60, 40, 40, 60 }));

            context_ = std::make_shared<SEALContext>(parms, true, sec_level_type::tc128);
            if (!context_->parameters_set()) {
                return false;
            }

            // Key generation
            KeyGenerator keygen(*context_);
            secret_key_ = keygen.secret_key();
            keygen.create_public_key(public_key_);
            keygen.create_relin_keys(relin_keys_);

            // Operators
            encoder_ = std::make_unique<CKKSEncoder>(*context_);
            encryptor_ = std::make_unique<Encryptor>(*context_, public_key_);
            evaluator_ = std::make_unique<Evaluator>(*context_);
            decryptor_ = std::make_unique<Decryptor>(*context_, secret_key_);

            scale_ = std::pow(2.0, 40);
            is_initialized_ = true;
            has_computed_result_ = false;
            return true;
        } catch (...) {
            return false;
        }
    }

    /**
     * Button 1: Encrypt & Compute
     * Encodes, encrypts, and performs homomorphic operation on ciphertexts.
     * Keeps the resulting ciphertext in WASM memory.
     */
    val encryptAndCompute(const val& js_vector_a, const val& js_vector_b, const std::string& operation) {
        val result = val::object();

        if (!is_initialized_) {
            result.set("success", false);
            result.set("error", std::string("CKKS module is not initialized."));
            return result;
        }

        try {
            std::vector<double> v_a = convertJSArrayToVector(js_vector_a);
            std::vector<double> v_b = convertJSArrayToVector(js_vector_b);

            if (v_a.empty() || v_a.size() != v_b.size()) {
                result.set("success", false);
                result.set("error", std::string("Vectors must be non-empty and of equal length."));
                return result;
            }

            vector_length_ = v_a.size();

            // 1. Encode Plaintexts
            Plaintext plain_a, plain_b;
            encoder_->encode(v_a, scale_, plain_a);
            encoder_->encode(v_b, scale_, plain_b);

            // 2. Encrypt Ciphertexts
            Ciphertext cipher_a, cipher_b;
            encryptor_->encrypt(plain_a, cipher_a);
            encryptor_->encrypt(plain_b, cipher_b);

            // 3. Homomorphic Evaluation
            if (operation == "add") {
                evaluator_->add(cipher_a, cipher_b, retained_ciphertext_);
            } else if (operation == "multiply") {
                evaluator_->multiply(cipher_a, cipher_b, retained_ciphertext_);
                evaluator_->relinearize_inplace(retained_ciphertext_, relin_keys_);
                evaluator_->rescale_to_next_inplace(retained_ciphertext_);
            } else {
                result.set("success", false);
                result.set("error", std::string("Unsupported operation: ") + operation);
                return result;
            }

            has_computed_result_ = true;
            result.set("success", true);
            result.set("operation", operation);
            result.set("message", std::string("Ciphertext evaluated and retained in WASM runtime."));
            return result;
        } catch (const std::exception& e) {
            result.set("success", false);
            result.set("error", std::string(e.what()));
            return result;
        } catch (...) {
            result.set("success", false);
            result.set("error", std::string("Unknown C++ exception occurred during evaluation."));
            return result;
        }
    }

    /**
     * Button 2: Decrypt & Reveal
     * Uses retained secret key in WASM to decrypt the retained ciphertext.
     */
    val decryptResult() {
        val result = val::object();

        if (!has_computed_result_) {
            result.set("success", false);
            result.set("error", std::string("No computed ciphertext found in WASM runtime. Run Encrypt & Compute first."));
            return result;
        }

        try {
            Plaintext plain_result;
            decryptor_->decrypt(retained_ciphertext_, plain_result);

            std::vector<double> decoded;
            encoder_->decode(plain_result, decoded);

            // Extract the active slots corresponding to the vector length
            val js_result = val::array();
            for (size_t i = 0; i < vector_length_ && i < decoded.size(); ++i) {
                js_result.call<void>("push", decoded[i]);
            }

            result.set("success", true);
            result.set("data", js_result);
            return result;
        } catch (const std::exception& e) {
            result.set("success", false);
            result.set("error", std::string(e.what()));
            return result;
        }
    }

    /**
     * Resets runtime demo state.
     */
    void resetDemo() {
        has_computed_result_ = false;
        vector_length_ = 0;
    }

private:
    std::vector<double> convertJSArrayToVector(const val& js_arr) {
        std::vector<double> vec;
        size_t len = js_arr["length"].as<size_t>();
        vec.reserve(len);
        for (size_t i = 0; i < len; ++i) {
            vec.push_back(js_arr[i].as<double>());
        }
        return vec;
    }

    bool is_initialized_;
    bool has_computed_result_;
    size_t vector_length_ = 0;
    double scale_ = 0.0;

    std::shared_ptr<SEALContext> context_;
    SecretKey secret_key_;
    PublicKey public_key_;
    RelinKeys relin_keys_;

    std::unique_ptr<CKKSEncoder> encoder_;
    std::unique_ptr<Encryptor> encryptor_;
    std::unique_ptr<Evaluator> evaluator_;
    std::unique_ptr<Decryptor> decryptor_;

    Ciphertext retained_ciphertext_;
};

// Emscripten Embind Bindings
EMSCRIPTEN_BINDINGS(ckks_module) {
    class_<CKKSModule>("CKKSModule")
        .constructor<>()
        .function("initializeCKKS", &CKKSModule::initializeCKKS)
        .function("encryptAndCompute", &CKKSModule::encryptAndCompute)
        .function("decryptResult", &CKKSModule::decryptResult)
        .function("resetDemo", &CKKSModule::resetDemo);
}

